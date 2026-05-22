"use client";

import { useResearchStore } from "@/store/researchStore";
import type { SSEMessage } from "@/types";

export function useResearch() {
  const store = useResearchStore();

  const startResearch = async (query: string) => {
    if (!query.trim() || store.isResearching) return;

    store.setQuery(query);
    store.startResearch();

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) throw new Error("Failed to start research");
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;

          try {
            const msg = JSON.parse(line.slice(6)) as SSEMessage & {
              sessionId?: string;
            };

            handleSSEMessage(msg);
          } catch {
            // ignore parse errors
          }
        }
      }
    } catch (err) {
      store.setError(
        err instanceof Error ? err.message : "Research failed"
      );
    }
  };

  const handleSSEMessage = (
    msg: SSEMessage & { sessionId?: string }
  ) => {
    switch (msg.type) {
      case "agent_start":
        if (msg.agent) {
          store.setAgentStatus(msg.agent, "working", msg.message);
          // First message contains the sessionId in the message field
          if (msg.agent === "orchestrator" && msg.message && msg.message.length > 10) {
            store.setSessionId(msg.message);
          }
        }
        break;

      case "agent_done":
        if (msg.agent) {
          store.setAgentStatus(msg.agent, "done", msg.message);
        }
        break;

      case "agent_error":
        if (msg.agent) {
          store.setAgentStatus(msg.agent, "error", msg.message);
        }
        break;

      case "chunk":
        if (msg.content) {
          store.appendChunk(msg.content);
        }
        break;

      case "complete":
        store.setComplete(
          msg.report || store.report,
          msg.sources || []
        );
        break;

      case "error":
        store.setError(msg.error || "Unknown error occurred");
        break;
    }
  };

  return { startResearch };
}
