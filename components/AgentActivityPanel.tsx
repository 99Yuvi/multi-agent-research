"use client";

import { cn } from "@/lib/utils";
import { useResearchStore } from "@/store/researchStore";
import type { AgentStatus } from "@/types";
import {
  BrainCircuit,
  Search,
  Globe,
  FileText,
  BarChart3,
  PenLine,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { AgentName } from "@/types";

const AGENT_ICONS: Record<AgentName, LucideIcon> = {
  orchestrator: BrainCircuit,
  search: Search,
  scraper: Globe,
  summarizer: FileText,
  analyst: BarChart3,
  report_writer: PenLine,
};

function StatusDot({ status }: { status: AgentStatus }) {
  return (
    <span
      className={cn(
        "inline-block h-2 w-2 rounded-full shrink-0",
        status === "idle" && "bg-border",
        status === "working" && "bg-amber-400 animate-pulse",
        status === "done" && "bg-success",
        status === "error" && "bg-destructive"
      )}
    />
  );
}

export function AgentActivityPanel() {
  const { agents, isResearching } = useResearchStore();

  const hasActivity = agents.some((a) => a.status !== "idle");

  if (!isResearching && !hasActivity) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-1">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
        Agent Activity
      </p>
      {agents.map((agent) => {
        const Icon = AGENT_ICONS[agent.name];
        return (
          <div
            key={agent.name}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
              agent.status === "working" && "bg-amber-50 dark:bg-amber-950/20",
              agent.status === "done" && "opacity-60"
            )}
          >
            <StatusDot status={agent.status} />
            <Icon
              className={cn(
                "h-4 w-4 shrink-0",
                agent.status === "working" ? "text-amber-600" : "text-muted-foreground"
              )}
            />
            <div className="flex-1 min-w-0">
              <span
                className={cn(
                  "text-sm font-medium",
                  agent.status === "working" ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {agent.label}
              </span>
              {agent.message && agent.status === "working" && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {agent.message}
                </p>
              )}
            </div>
            <span className="text-xs text-muted-foreground capitalize shrink-0">
              {agent.status === "idle" ? "—" : agent.status}
            </span>
          </div>
        );
      })}
    </div>
  );
}
