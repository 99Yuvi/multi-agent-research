export type AgentName =
  | "orchestrator"
  | "search"
  | "scraper"
  | "summarizer"
  | "analyst"
  | "report_writer";

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
}

export interface ResearchSource {
  title: string;
  url: string;
  snippet?: string;
}

export type SSEMessageType =
  | "agent_start"
  | "agent_done"
  | "agent_error"
  | "chunk"
  | "complete"
  | "error";

export interface SSEMessage {
  type: SSEMessageType;
  agent?: AgentName;
  message?: string;
  content?: string;
  sources?: ResearchSource[];
  report?: string;
  error?: string;
}

export interface ResearchSession {
  id: string;
  query: string;
  status: "pending" | "running" | "completed" | "failed";
  createdAt: string;
  report?: { content: string };
  sources: ResearchSource[];
}
