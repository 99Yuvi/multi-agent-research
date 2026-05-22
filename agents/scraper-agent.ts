import * as cheerio from "cheerio";
import type { ScrapedContent } from "@/types";

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

    // Extract main content — prioritize article/main tags
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
      wordCount: content.split(/\s+/).length,
    };
  } catch (error) {
    return {
      url,
      title: "Failed to scrape",
      content: `Could not retrieve content from ${url}: ${error instanceof Error ? error.message : "Unknown error"}`,
      wordCount: 0,
    };
  }
}
