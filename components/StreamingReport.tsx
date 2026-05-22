"use client";

import { useResearchStore } from "@/store/researchStore";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportExport } from "./ReportExport";
import { ExternalLink, Phone, MapPin, Star, IndianRupee } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Listing table cell parser ─────────────────────────────────────────────────
// Detects if a table row looks like a listings table (has price/phone columns)
function isListingTable(headers: string[]): boolean {
  const lower = headers.map((h) => h.toLowerCase());
  return (
    lower.some((h) => h.includes("price") || h.includes("cost") || h.includes("rate")) ||
    lower.some((h) => h.includes("phone") || h.includes("contact") || h.includes("number"))
  );
}

function CellContent({ value }: { value: string }) {
  const v = value.trim();
  if (!v || v === "—" || v === "-" || v === "null") {
    return <span className="text-muted-foreground text-xs">—</span>;
  }

  // Phone number
  if (/^\+?[\d\s\-()]{7,}$/.test(v) || v.startsWith("+91")) {
    return (
      <a href={`tel:${v.replace(/\s/g, "")}`}
        className="inline-flex items-center gap-1 text-primary hover:underline text-sm font-medium">
        <Phone className="h-3 w-3 shrink-0" />
        {v}
      </a>
    );
  }

  // Price — has ₹ or Rs or /night
  if (v.includes("₹") || v.includes("Rs") || v.includes("/night") || v.includes("/person")) {
    return (
      <span className="inline-flex items-center gap-0.5 text-green-700 font-semibold text-sm">
        <IndianRupee className="h-3 w-3 shrink-0" />
        {v.replace("₹", "").replace("Rs", "").trim()}
      </span>
    );
  }

  // Rating — has /5
  if (/^\d(\.\d)?\/5$/.test(v) || /^\d(\.\d)?\s*\/\s*5$/.test(v)) {
    return (
      <span className="inline-flex items-center gap-1 text-amber-600 font-medium text-sm">
        <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
        {v}
      </span>
    );
  }

  // Address — has Road/Street/Village/Near
  if (/road|street|village|near|marg|nagar|district|distt|hp|himachal|manali/i.test(v)) {
    return (
      <span className="inline-flex items-start gap-1 text-sm text-muted-foreground">
        <MapPin className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground" />
        <span>{v}</span>
      </span>
    );
  }

  return <span className="text-sm text-foreground">{v}</span>;
}

export function StreamingReport() {
  const { report, sources, isResearching, query } = useResearchStore();

  if (!isResearching && !report) return null;

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <div>
          <p className="text-sm font-medium text-foreground">Research Report</p>
          {query && (
            <p className="text-xs text-muted-foreground truncate max-w-[400px]">{query}</p>
          )}
        </div>
        {report && !isResearching && <ReportExport report={report} query={query} />}
      </div>

      {/* Skeleton while loading */}
      {isResearching && !report && (
        <div className="p-5 space-y-3">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      )}

      {/* Report content */}
      {report && (
        <div className="p-5">
          <div className="max-w-none text-foreground space-y-1">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => (
                  <h1 className="text-2xl font-semibold text-foreground mb-4 mt-0 pb-2 border-b border-border">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-lg font-semibold text-foreground mb-3 mt-6">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-base font-semibold text-foreground mb-2 mt-4">{children}</h3>
                ),
                p: ({ children }) => (
                  <p className="text-sm text-foreground mb-3 leading-relaxed">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc ps-5 mb-3 space-y-1 text-sm">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal ps-5 mb-3 space-y-1 text-sm">{children}</ol>
                ),
                li: ({ children }) => (
                  <li className="text-sm text-foreground leading-relaxed">{children}</li>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-foreground">{children}</strong>
                ),
                a: ({ href, children }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer"
                    className="text-primary underline underline-offset-4 text-sm">
                    {children}
                  </a>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-s-2 border-border ps-4 text-muted-foreground italic my-3 text-sm">
                    {children}
                  </blockquote>
                ),
                code: ({ children }) => (
                  <code className="bg-secondary text-foreground rounded px-1 py-0.5 text-xs font-mono">
                    {children}
                  </code>
                ),
                hr: () => <hr className="border-border my-4" />,

                // ── TABLES ────────────────────────────────────────────────────
                table: ({ children }) => (
                  <div className="my-4 rounded-lg border border-border overflow-hidden shadow-none">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">{children}</table>
                    </div>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-secondary/60 border-b border-border">{children}</thead>
                ),
                tbody: ({ children }) => (
                  <tbody className="divide-y divide-border">{children}</tbody>
                ),
                tr: ({ children }) => (
                  <tr className="hover:bg-secondary/30 transition-colors">{children}</tr>
                ),
                th: ({ children }) => (
                  <th className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    {children}
                  </th>
                ),
                td: ({ children }) => {
                  // Get raw text to apply smart rendering
                  const raw = typeof children === "string"
                    ? children
                    : Array.isArray(children)
                      ? children.map((c) => (typeof c === "string" ? c : "")).join("")
                      : "";

                  return (
                    <td className="px-4 py-3 align-top max-w-[220px]">
                      <CellContent value={raw || String(children)} />
                    </td>
                  );
                },
              }}
            >
              {report}
            </ReactMarkdown>

            {isResearching && (
              <span className="inline-block h-4 w-0.5 bg-foreground animate-pulse ms-0.5" />
            )}
          </div>
        </div>
      )}

      {/* Sources */}
      {sources.length > 0 && !isResearching && (
        <div className="border-t border-border px-5 py-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Sources ({sources.length})
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {sources.map((source, i) => (
              <a key={i} href={source.url} target="_blank" rel="noopener noreferrer"
                className="flex items-start gap-2 group rounded-md p-2 hover:bg-secondary transition-colors">
                <div className="h-5 w-5 rounded bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs text-muted-foreground font-medium">{i + 1}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-foreground group-hover:underline underline-offset-2 line-clamp-1 font-medium">
                    {source.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{source.url}</p>
                </div>
                <ExternalLink className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
