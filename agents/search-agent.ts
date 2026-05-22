import { tavily } from "@tavily/core";
import type { SearchResult } from "@/types";

const client = tavily({ apiKey: process.env.TAVILY_API_KEY || "" });

export async function searchAgent(
  query: string,
  maxResults: number = 5
): Promise<{ results: SearchResult[]; answer?: string }> {
  try {
    const response = await client.search(query, {
      maxResults,
      includeAnswer: true,
      searchDepth: "advanced",
    });

    const results: SearchResult[] = response.results.map((r) => ({
      title: r.title,
      url: r.url,
      snippet: r.content,
      source: r.url,
    }));

    return {
      results,
      answer: response.answer || undefined,
    };
  } catch (error) {
    console.error("Search agent error:", error);
    return { results: [] };
  }
}
