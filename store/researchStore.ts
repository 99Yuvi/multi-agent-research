import { create } from "zustand";
import type { AgentName, AgentState, AgentStatus, ResearchSource } from "@/types";

const AGENT_LABELS: Record<AgentName, string> = {
  orchestrator: "Orchestrator",
  search: "Search Agent",
  scraper: "Scraper Agent",
  summarizer: "Summarizer Agent",
  analyst: "Analyst Agent",
  report_writer: "Report Writer",
};

const ALL_AGENTS: AgentName[] = [
  "orchestrator",
  "search",
  "scraper",
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
  // Query
  query: string;
  setQuery: (q: string) => void;

  // Research state
  isResearching: boolean;
  sessionId: string | null;
  agents: AgentState[];
  report: string;
  sources: ResearchSource[];
  error: string | null;

  // Actions
  startResearch: () => void;
  resetResearch: () => void;
  setAgentStatus: (name: AgentName, status: AgentStatus, message?: string) => void;
  appendChunk: (chunk: string) => void;
  setComplete: (report: string, sources: ResearchSource[]) => void;
  setError: (error: string) => void;
  setSessionId: (id: string) => void;
}

export const useResearchStore = create<ResearchStore>((set) => ({
  query: "",
  setQuery: (q) => set({ query: q }),

  isResearching: false,
  sessionId: null,
  agents: makeInitialAgents(),
  report: "",
  sources: [],
  error: null,

  startResearch: () =>
    set({
      isResearching: true,
      agents: makeInitialAgents(),
      report: "",
      sources: [],
      error: null,
      sessionId: null,
    }),

  resetResearch: () =>
    set({
      isResearching: false,
      agents: makeInitialAgents(),
      report: "",
      sources: [],
      error: null,
      sessionId: null,
    }),

  setAgentStatus: (name, status, message) =>
    set((state) => ({
      agents: state.agents.map((a) =>
        a.name === name ? { ...a, status, message } : a
      ),
    })),

  appendChunk: (chunk) =>
    set((state) => ({ report: state.report + chunk })),

  setComplete: (report, sources) =>
    set({
      isResearching: false,
      report,
      sources,
      agents: makeInitialAgents().map((a) => ({ ...a, status: "done" as AgentStatus })),
    }),

  setError: (error) =>
    set({ isResearching: false, error }),

  setSessionId: (id) => set({ sessionId: id }),
}));
