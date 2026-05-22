import * as cheerio from "cheerio";
import type { ScrapedContent } from "@/types";

// Reject data-URIs, SVGs, and suspiciously short URLs (likely relative stubs)
function isUsableImage(src: string): boolean {
  if (!src) return false;
  if (src.startsWith("data:")) return false;
  if (src.endsWith(".svg")) return false;
  if (src.length < 10) return false;
  return true;
}

// Turn relative URLs into absolute ones
function toAbsoluteUrl(src: string, base: string): string {
  try {
    return new URL(src, base).href;
  } catch {
    return "";
  }
}

export async function scraperAgent(url: string): Promise<ScrapedContent> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ResearchBot/1.0; +https://research-agent.vercel.app)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove non-content elements
    $("script, style, nav, footer, header, aside, .ad, .advertisement, .cookie-banner").remove();

    const title = $("title").text().trim() || $("h1").first().text().trim();

    // ── Extract images ────────────────────────────────────────────────────
    const imageSet = new Set<string>();

    // 1. Open Graph image (most reliable — used by all major hotel/travel sites)
    const ogImage = $('meta[property="og:image"]').attr("content");
    if (ogImage && isUsableImage(ogImage)) imageSet.add(ogImage);

    // 2. Twitter card image
    const twitterImage = $('meta[name="twitter:image"]').attr("content");
    if (twitterImage && isUsableImage(twitterImage)) imageSet.add(twitterImage);

    // 3. First few prominent <img> tags (skip tiny icons/logos)
    $("img").each((_, el) => {
      if (imageSet.size >= 6) return false; // stop after 6
      const src = $(el).attr("src") || $(el).attr("data-src") || $(el).attr("data-lazy-src");
      if (!src) return;
      const abs = toAbsoluteUrl(src, url);
      if (abs && isUsableImage(abs)) imageSet.add(abs);
    });

    const images = [...imageSet].slice(0, 6);

    // ── Extract main content — prioritize article/main tags ───────────────
    const contentSelectors = ["article", "main", ".content", "#content", "body"];
    let contentEl = $("body");
    for (const sel of contentSelectors) {
      if ($(sel).length) {
        contentEl = $(sel).first();
        break;
      }
    }

    const content = contentEl
      .text()
      .replace(/\s+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
      .slice(0, 6000); // Limit to 6k chars to stay within token limits

    return {
      url,
      title,
      content,
      images,
      wordCount: content.split(/\s+/).length,
    };
  } catch (error) {
    return {
      url,
      title: "Failed to scrape",
      content: `Could not retrieve content from ${url}: ${error instanceof Error ? error.message : "Unknown error"}`,
      images: [],
      wordCount: 0,
    };
  }
}
