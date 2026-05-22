import { create } from "zustand";
import type { AgentName, AgentState, AgentStatus, ExtractedListing, ResearchSource, TokenUsage } from "@/types";

const AGENT_LABELS: Record<AgentName, string> = {
  orchestrator: "Orchestrator",
  search: "Search Agent",
  scraper: "Scraper Agent",
  extractor: "Extractor Agent",
  summarizer: "Summarizer Agent",
  analyst: "Analyst Agent",
  report_writer: "Report Writer",
};

const ALL_AGENTS: AgentName[] = [
  "orchestrator",
  "search",
  "scraper",
  "extractor",
  "summarizer",
  "analyst",
  "report_writer",
];

function makeInitialAgents(): AgentState[] {
  return ALL_AGENTS.map((name) => ({
    name,
    label: AGENT_LABELS[name],
    status: "idle" as AgentStatus,
  }));
}

interface ResearchStore {
  query: string;
  setQuery: (q: string) => void;

  isResearching: boolean;
  sessionId: string | null;
  agents: AgentState[];
  report: string;
  sources: ResearchSource[];
  listings: ExtractedListing[];
  error: string | null;
  tokenUsage: TokenUsage | null;

  startResearch: () => void;
  resetResearch: () => void;
  setAgentStatus: (name: AgentName, status: AgentStatus, message?: string) => void;
  appendChunk: (chunk: string) => void;
  setComplete: (report: string, sources: ResearchSource[], tokenUsage?: TokenUsage) => void;
  setError: (error: string) => void;
  setSessionId: (id: string) => void;
  setTokenUsage: (usage: TokenUsage) => void;
  setListings: (listings: ExtractedListing[]) => void;
}

export const useResearchStore = create<ResearchStore>((set) => ({
  query: "",
  setQuery: (q) => set({ query: q }),

  isResearching: false,
  sessionId: null,
  agents: makeInitialAgents(),
  report: "",
  sources: [],
  listings: [],
  error: null,
  tokenUsage: null,

  startResearch: () =>
    set({
      isResearching: true,
      agents: makeInitialAgents(),
      report: "",
      sources: [],
      listings: [],
      error: null,
      sessionId: null,
      tokenUsage: null,
    }),

  resetResearch: () =>
    set({
      isResearching: false,
      agents: makeInitialAgents(),
      report: "",
      sources: [],
      listings: [],
      error: null,
      sessionId: null,
      tokenUsage: null,
    }),

  setAgentStatus: (name, status, message) =>
    set((state) => ({
      agents: state.agents.map((a) =>
        a.name === name ? { ...a, status, message } : a
      ),
    })),

  appendChunk: (chunk) =>
    set((state) => ({ report: state.report + chunk })),

  setComplete: (report, sources, tokenUsage) =>
    set({
      isResearching: false,
      report,
      sources,
      tokenUsage: tokenUsage ?? null,
      agents: makeInitialAgents().map((a) => ({ ...a, status: "done" as AgentStatus })),
    }),

  setError: (error) =>
    set({ isResearching: false, error }),

  setSessionId: (id) => set({ sessionId: id }),

  setTokenUsage: (usage) => set({ tokenUsage: usage }),

  setListings: (listings) => set({ listings }),
}));
