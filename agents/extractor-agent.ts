import { getAIClient, MODELS, calcCost } from "@/lib/ai-client";
import type { ExtractedListing, ModelUsage } from "@/types";

const MODEL = MODELS.summarizer; // fast + cheap model

/**
 * Detects if a query is asking for listings (hotels, restaurants, shops, etc.)
 * Returns true if structured extraction makes sense.
 */
export function isListingQuery(query: string): boolean {
  const keywords = [
    "hotel", "hotels", "resort", "hostel", "stay", "accommodation",
    "restaurant", "cafe", "food", "eat", "dine",
    "shop", "store", "market", "buy",
    "hospital", "clinic", "doctor",
    "contact", "phone", "number", "address",
    "price", "cost", "rate", "cheap", "budget",
    "list", "listing", "find me", "show me", "give me",
  ];
  const lower = query.toLowerCase();
  return keywords.some((k) => lower.includes(k));
}

export async function extractorAgent(
  scrapedContents: Array<{ url: string; content: string; images: string[] }>,
  query: string
): Promise<{ listings: ExtractedListing[]; usage: ModelUsage }> {
  const openai = getAIClient();

  // Collect all images from all sources into a pool (for later assignment)
  const imagePool: string[] = scrapedContents.flatMap((s) => s.images);

  const combinedText = scrapedContents
    .map((s, i) => `=== Source ${i + 1}: ${s.url} ===\n${s.content.slice(0, 2000)}`)
    .join("\n\n");

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content: `You are a structured data extractor. Extract listings from web content into JSON.

Return ONLY a valid JSON array like this (no markdown, no explanation):
[
  {
    "name": "Hotel Name",
    "price": "₹1200/night or price range",
    "phone": "+91-XXXXXXXXXX or null",
    "address": "Full address or area name",
    "rating": "4.2/5 or null",
    "website": "URL or null",
    "notes": "Any important detail like free breakfast, AC, etc."
  }
]

Rules:
- Extract ALL listings/hotels/places mentioned in the content
- If a field is not available, use null
- price: include currency symbol and per-night/per-person if mentioned
- phone: extract any phone number found near the listing
- Return empty array [] if no listings found
- Do NOT wrap in markdown code blocks`,
      },
      {
        role: "user",
        content: `Query: "${query}"\n\nExtract all listings from this content:\n\n${combinedText}`,
      },
    ],
    max_tokens: 1500,
    temperature: 0.1, // low temp for structured output
  });

  const raw = response.choices[0]?.message?.content || "[]";
  const u = response.usage!;

  let listings: ExtractedListing[] = [];
  try {
    // Strip markdown code fences if model added them
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    listings = Array.isArray(parsed) ? parsed : [];
  } catch {
    listings = [];
  }

  // Assign scraped images to listings round-robin (best-effort)
  listings = listings.map((listing, i) => ({
    ...listing,
    image: listing.image || imagePool[i % imagePool.length] || undefined,
  }));

  return {
    listings,
    usage: {
      model: MODEL,
      promptTokens: u.prompt_tokens,
      completionTokens: u.completion_tokens,
      totalTokens: u.total_tokens,
      costUsd: calcCost(MODEL, u.prompt_tokens, u.completion_tokens),
    },
  };
}
