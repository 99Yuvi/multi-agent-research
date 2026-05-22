"use client";

import { useResearchStore } from "@/store/researchStore";
import { Coins } from "lucide-react";
import { cn } from "@/lib/utils";

const MODEL_COLORS: Record<string, string> = {
  "gpt-4o":                    "bg-purple-50 text-purple-700 border-purple-200",
  "gpt-4o-mini":               "bg-blue-50   text-blue-700   border-blue-200",
  "gpt-4o (orchestrator)":     "bg-indigo-50 text-indigo-700 border-indigo-200",
  "llama-3.3-70b-versatile":   "bg-green-50  text-green-700  border-green-200",
  "llama-3.1-8b-instant":      "bg-teal-50   text-teal-700   border-teal-200",
};

function modelColor(model: string) {
  for (const key of Object.keys(MODEL_COLORS)) {
    if (model.includes(key.replace(" (orchestrator)", ""))) return MODEL_COLORS[key];
  }
  return "bg-secondary text-muted-foreground border-border";
}

function isGroqModel(model: string) {
  return model.includes("llama") || model.includes("mixtral") || model.includes("gemma");
}

export function TokenUsagePanel() {
  const { tokenUsage, isResearching } = useResearchStore();

  if (!tokenUsage && !isResearching) return null;
  if (!tokenUsage) return null;

  const { breakdown, totalTokens, totalCostUsd } = tokenUsage;
  const usingGroq = breakdown.some((m) => isGroqModel(m.model));

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coins className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">Token Usage</p>
          {usingGroq && (
            <span className="text-xs px-1.5 py-0.5 rounded border bg-green-50 text-green-700 border-green-200 font-medium">
              Groq · Free
            </span>
          )}
          {isResearching && (
            <span className="text-xs text-muted-foreground animate-pulse">(live)</span>
          )}
        </div>
        <div className="text-end">
          <p className="text-sm font-semibold text-foreground tabular-nums">
            {totalTokens.toLocaleString()} tokens
          </p>
          <p className="text-xs text-muted-foreground tabular-nums">
            ≈ ${totalCostUsd.toFixed(4)}
          </p>
        </div>
      </div>

      {/* Per-model breakdown */}
      <div className="space-y-1.5">
        {breakdown.map((m, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className={cn(
                "text-xs px-1.5 py-0.5 rounded border font-mono shrink-0",
                modelColor(m.model)
              )}
            >
              {m.model}
            </span>
            <div className="flex-1 min-w-0">
              {/* Token bar */}
              <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full bg-foreground/20 rounded-full"
                  style={{ width: `${Math.min((m.totalTokens / Math.max(totalTokens, 1)) * 100, 100)}%` }}
                />
              </div>
            </div>
            <div className="text-end shrink-0">
              <span className="text-xs text-muted-foreground tabular-nums">
                {m.totalTokens.toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed table */}
      <div className="border border-border rounded-md overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="text-start px-3 py-1.5 text-muted-foreground font-medium">Model</th>
              <th className="text-end px-3 py-1.5 text-muted-foreground font-medium">Input</th>
              <th className="text-end px-3 py-1.5 text-muted-foreground font-medium">Output</th>
              <th className="text-end px-3 py-1.5 text-muted-foreground font-medium">Total</th>
              <th className="text-end px-3 py-1.5 text-muted-foreground font-medium">Cost</th>
            </tr>
          </thead>
          <tbody>
            {breakdown.map((m, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                <td className="px-3 py-1.5 text-foreground font-mono">{m.model}</td>
                <td className="px-3 py-1.5 text-end text-muted-foreground tabular-nums">{m.promptTokens.toLocaleString()}</td>
                <td className="px-3 py-1.5 text-end text-muted-foreground tabular-nums">{m.completionTokens.toLocaleString()}</td>
                <td className="px-3 py-1.5 text-end text-foreground tabular-nums font-medium">{m.totalTokens.toLocaleString()}</td>
                <td className="px-3 py-1.5 text-end text-muted-foreground tabular-nums">${m.costUsd.toFixed(4)}</td>
              </tr>
            ))}
            {/* Totals row */}
            <tr className="bg-secondary/30">
              <td className="px-3 py-1.5 text-foreground font-semibold">Total</td>
              <td className="px-3 py-1.5 text-end text-foreground font-semibold tabular-nums">
                {breakdown.reduce((s, m) => s + m.promptTokens, 0).toLocaleString()}
              </td>
              <td className="px-3 py-1.5 text-end text-foreground font-semibold tabular-nums">
                {breakdown.reduce((s, m) => s + m.completionTokens, 0).toLocaleString()}
              </td>
              <td className="px-3 py-1.5 text-end text-foreground font-semibold tabular-nums">
                {totalTokens.toLocaleString()}
              </td>
              <td className="px-3 py-1.5 text-end text-foreground font-semibold tabular-nums">
                ${totalCostUsd.toFixed(4)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        Prices: GPT-4o $2.50/$10.00 · GPT-4o-mini $0.15/$0.60 per 1M tokens (input/output)
      </p>
    </div>
  );
}
