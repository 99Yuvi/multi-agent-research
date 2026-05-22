/**
 * Deterministic Research Orchestrator
 *
 * Pipeline:
 *   1. Search  →  2. Scrape  →  3. Extract (if listing query)
 *   →  4. Summarize  →  5. Analyze  →  6. Report
 */

import { searchAgent } from "./search-agent";
import { scraperAgent } from "./scraper-agent";
import { summarizerAgent } from "./summarizer-agent";
import { analystAgent } from "./analyst-agent";
import { reportWriterAgent } from "./report-writer-agent";
import { extractorAgent, isListingQuery } from "./extractor-agent";
import { IS_GROQ } from "@/lib/ai-client";
import type { AgentName, SSEMessage, ResearchSource, ModelUsage, TokenUsage } from "@/types";

type SendFn = (msg: SSEMessage) => void;

function buildTokenUsage(breakdown: ModelUsage[]): TokenUsage {
  const totalTokens = breakdown.reduce((s, m) => s + m.totalTokens, 0);
  const totalCostUsd = breakdown.reduce((s, m) => s + m.costUsd, 0);
  return { breakdown, totalTokens, totalCostUsd };
}

function logUsage(label: string, usage: ModelUsage) {
  const provider = IS_GROQ ? "groq" : "openai";
  console.log(
    `[TOKEN][${provider}] ${label.padEnd(14)} | model=${usage.model.padEnd(26)} | ` +
    `in=${String(usage.promptTokens).padStart(5)} | ` +
    `out=${String(usage.completionTokens).padStart(5)} | ` +
    `total=${String(usage.totalTokens).padStart(6)} | ` +
    `cost=$${usage.costUsd.toFixed(5)}`
  );
}


export async function runResearch(query: string, send: SendFn): Promise<string> {
  const sources: ResearchSource[] = [];
  const summaries: string[] = [];
  const allUsage: ModelUsage[] = [];
  const listingMode = isListingQuery(query);

  const agentSend = (agent: AgentName, status: "start" | "done", message?: string) => {
    send({ type: status === "start" ? "agent_start" : "agent_done", agent, message });
  };

  const pushUsage = (label: string, usage: ModelUsage) => {
    allUsage.push(usage);
    logUsage(label, usage);
    send({ type: "token_usage", tokenUsage: buildTokenUsage([...allUsage]) });
  };

  // ── STEP 1: SEARCH ──────────────────────────────────────────────────────────
  agentSend("orchestrator", "start", "Planning research strategy...");

  // Listing queries get a contact-focused search term added
  const searchQueries = listingMode
    ? [query, `${query} contact phone number address`]
    : [query, `${query} complete guide`];

  const urlsSeen = new Set<string>();

  for (const q of searchQueries) {
    agentSend("search", "start", `Searching: "${q}"`);
    const result = await searchAgent(q, 5);
    result.results.forEach((r) => {
      if (!urlsSeen.has(r.url)) {
        urlsSeen.add(r.url);
        sources.push({ title: r.title, url: r.url, snippet: r.snippet });
      }
    });
    agentSend("search", "done", `Found ${result.results.length} results`);
  }

  agentSend("orchestrator", "done");

  // ── STEP 2: SCRAPE top URLs ─────────────────────────────────────────────────
  const urlsToScrape = sources.slice(0, 4);
  const scrapedContents: Array<{ url: string; content: string; images: string[] }> = [];

  for (const source of urlsToScrape) {
    agentSend("scraper", "start", `Reading: ${source.url}`);
    const scraped = await scraperAgent(source.url);
    if (scraped.wordCount > 50) {
      scrapedContents.push({ url: source.url, content: scraped.content, images: scraped.images });
    }
    agentSend("scraper", "done", `Read ${scraped.wordCount} words`);
  }

  // ── STEP 3: EXTRACT LISTINGS (only for listing queries) ────────────────────
  if (listingMode && scrapedContents.length > 0) {
    agentSend("extractor", "start", "Extracting names, prices & contacts...");
    const { listings, usage } = await extractorAgent(scrapedContents, query);
    pushUsage("extractor", usage);
    agentSend("extractor", "done", `Found ${listings.length} listings`);

    if (listings.length > 0) {
      console.log(`[EXTRACTOR] Found ${listings.length} listings`);
      // Send listings as structured data — UI renders them as image cards
      send({ type: "listings", listings });
    }
  }

  // ── STEP 4: SUMMARIZE each scraped page ────────────────────────────────────
  for (const { url, content } of scrapedContents) {
    agentSend("summarizer", "start", `Summarizing: ${url}`);
    const { text, usage } = await summarizerAgent(content, "detailed");
    summaries.push(text);
    pushUsage("summarizer", usage);
    agentSend("summarizer", "done");
  }

  // ── STEP 5: ANALYZE ────────────────────────────────────────────────────────
  agentSend("analyst", "start", "Analyzing insights...");
  const combinedSummaries = summaries.join("\n\n---\n\n");
  const { text: analysis, usage: analysisUsage } = await analystAgent(
    combinedSummaries,
    listingMode ? "key_points" : "key_points"
  );
  pushUsage("analyst", analysisUsage);
  agentSend("analyst", "done");

  // ── STEP 6: GENERATE REPORT ────────────────────────────────────────────────
  agentSend("report_writer", "start", "Writing research report...");
  const { text: baseReport, usage: reportUsage } = await reportWriterAgent({
    topic: query,
    summaries,
    analysis,
    sources,
  });
  pushUsage("report_writer", reportUsage);

  // Listings are shown as image cards in the UI — no need to duplicate as markdown table
  const finalReport = baseReport;

  const finalUsage = buildTokenUsage([...allUsage]);
  console.log("─".repeat(72));
  console.log(`[TOKEN] TOTAL | tokens=${finalUsage.totalTokens} | cost=$${finalUsage.totalCostUsd.toFixed(5)} | provider=${IS_GROQ ? "groq (FREE)" : "openai"}`);
  console.log("─".repeat(72));

  // Stream report
  const words = finalReport.split(" ");
  for (let i = 0; i < words.length; i += 8) {
    const chunk = words.slice(i, i + 8).join(" ") + (i + 8 < words.length ? " " : "");
    send({ type: "chunk", content: chunk });
  }

  send({ type: "complete", report: finalReport, sources, agent: "report_writer", tokenUsage: finalUsage });
  return finalReport;
}
