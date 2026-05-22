"use client";

import { useResearchStore } from "@/store/researchStore";
import ReactMarkdown from "react-markdown";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportExport } from "./ReportExport";
import { ExternalLink } from "lucide-react";

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
            <p className="text-xs text-muted-foreground truncate max-w-[400px]">
              {query}
            </p>
          )}
        </div>
        {report && !isResearching && <ReportExport report={report} query={query} />}
      </div>

      {/* Report content */}
      <div className="p-5">
        {isResearching && !report && (
          <div className="space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        )}

        {report && (
          <div className="prose prose-sm max-w-none text-foreground">
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h1 className="text-2xl font-semibold text-foreground mb-4 mt-0">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-xl font-semibold text-foreground mb-3 mt-6">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-lg font-semibold text-foreground mb-2 mt-4">{children}</h3>
                ),
                p: ({ children }) => (
                  <p className="text-base text-foreground mb-3 leading-relaxed">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc ps-5 mb-3 space-y-1">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal ps-5 mb-3 space-y-1">{children}</ol>
                ),
                li: ({ children }) => (
                  <li className="text-base text-foreground">{children}</li>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-foreground">{children}</strong>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline underline-offset-4"
                  >
                    {children}
                  </a>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-s-2 border-border ps-4 text-muted-foreground italic my-3">
                    {children}
                  </blockquote>
                ),
                code: ({ children }) => (
                  <code className="bg-secondary text-foreground rounded px-1 py-0.5 text-sm font-mono">
                    {children}
                  </code>
                ),
                hr: () => <hr className="border-border my-4" />,
              }}
            >
              {report}
            </ReactMarkdown>

            {isResearching && (
              <span className="inline-block h-4 w-0.5 bg-foreground animate-pulse ms-0.5" />
            )}
          </div>
        )}
      </div>

      {/* Sources */}
      {sources.length > 0 && !isResearching && (
        <div className="border-t border-border px-5 py-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Sources ({sources.length})
          </p>
          <div className="space-y-2">
            {sources.map((source, i) => (
              <a
                key={i}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 group"
              >
                <ExternalLink className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0 group-hover:text-foreground transition-colors" />
                <div className="min-w-0">
                  <p className="text-sm text-foreground group-hover:underline underline-offset-2 truncate">
                    {source.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{source.url}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
