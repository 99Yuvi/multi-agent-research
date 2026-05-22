export type AgentName =
  | "orchestrator"
  | "search"
  | "scraper"
  | "summarizer"
  | "analyst"
  | "extractor"
  | "report_writer";

// Structured listing extracted from scraped content
export interface ExtractedListing {
  name: string;
  price?: string;
  phone?: string;
  address?: string;
  rating?: string;
  website?: string;
  image?: string;   // og:image or first meaningful img URL from the source page
  notes?: string;
}

export type AgentStatus = "idle" | "working" | "done" | "error";

export interface AgentState {
  name: AgentName;
  label: string;
  status: AgentStatus;
  message?: string;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source?: string;
}

export interface ScrapedContent {
  url: string;
  title: string;
  content: string;
  wordCount: number;
  images: string[];   // og:image + prominent <img> src URLs found on the page
}

export interface ResearchSource {
  title: string;
  url: string;
  snippet?: string;
}

// Token usage tracking
export interface ModelUsage {
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUsd: number; // estimated
}

export interface TokenUsage {
  breakdown: ModelUsage[];
  totalTokens: number;
  totalCostUsd: number;
}

export type SSEMessageType =
  | "agent_start"
  | "agent_done"
  | "agent_error"
  | "chunk"
  | "complete"
  | "listings"
  | "token_usage"
  | "error";

export interface SSEMessage {
  type: SSEMessageType;
  agent?: AgentName;
  message?: string;
  content?: string;
  sources?: ResearchSource[];
  report?: string;
  error?: string;
  tokenUsage?: TokenUsage;
  listings?: ExtractedListing[];
}

export interface ResearchSession {
  id: string;
  query: string;
  status: "pending" | "running" | "completed" | "failed";
  createdAt: string;
  report?: { content: string };
  sources: ResearchSource[];
  listings: ExtractedListing[];
}
