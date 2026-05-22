"use client";

import { useEffect, useState } from "react";
import {
  Clock, Trash2, ChevronDown, ChevronUp,
  ExternalLink, Download, Copy, Check,
  Phone, MapPin, Star, IndianRupee, ImageOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { ResearchSession } from "@/types";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// ── Inline copy+download for history reports ──────────────────────────────────
function HistoryReportActions({ report, query }: { report: string; query: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(report);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const download = () => {
    const filename = `research-${query.slice(0, 30).replace(/\s+/g, "-").toLowerCase()}.md`;
    const blob = new Blob([`# ${query}\n\n${report}`], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded", { description: filename });
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={copy} className="gap-1.5 h-8 text-xs">
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "Copied" : "Copy"}
      </Button>
      <Button variant="outline" size="sm" onClick={download} className="gap-1.5 h-8 text-xs">
        <Download className="h-3.5 w-3.5" />
        Download
      </Button>
    </div>
  );
}

// ── Listing image card (inline, no external component dep) ───────────────────
function ListingCard({ listing }: { listing: ResearchSession["listings"][number] }) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden flex flex-col">
      {listing.image && !imgFailed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={listing.image} alt={listing.name}
          className="h-36 w-full object-cover"
          onError={() => setImgFailed(true)} />
      ) : (
        <div className="h-36 w-full bg-secondary flex items-center justify-center">
          <ImageOff className="h-6 w-6 text-muted-foreground/30" />
        </div>
      )}
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <p className="text-sm font-semibold text-foreground line-clamp-2 leading-snug">{listing.name}</p>
        {listing.price && (
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-green-700">
            <IndianRupee className="h-3.5 w-3.5 shrink-0" />
            {listing.price.replace("₹", "").replace("Rs", "").trim()}
          </span>
        )}
        {listing.rating && (
          <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
            {listing.rating}
          </span>
        )}
        {listing.address && (
          <span className="inline-flex items-start gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
            <span className="line-clamp-2">{listing.address}</span>
          </span>
        )}
        <div className="mt-auto pt-2 border-t border-border">
          {listing.phone ? (
            <a href={`tel:${listing.phone.replace(/\s/g, "")}`}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium">
              <Phone className="h-3 w-3 shrink-0" />{listing.phone}
            </a>
          ) : listing.website ? (
            <a href={listing.website} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-border bg-secondary hover:bg-secondary/80 text-foreground font-medium transition-colors">
              <ExternalLink className="h-3 w-3 shrink-0" />Book Online
            </a>
          ) : (
            <span className="text-xs text-muted-foreground italic">Contact not available</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Full report rendered with ReactMarkdown ───────────────────────────────────
function FullReport({ session }: { session: ResearchSession }) {
  if (!session.report) {
    return (
      <p className="text-sm text-muted-foreground italic px-5 py-4">
        Report not available for this session.
      </p>
    );
  }

  return (
    <div className="border-t border-border bg-background">
      {/* Report header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Full Report
        </p>
        <HistoryReportActions report={session.report.content} query={session.query} />
      </div>

      {/* Listing cards — only shown if this was a listing query */}
      {session.listings.length > 0 && (
        <div className="px-5 py-4 border-b border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {session.listings.length} listing{session.listings.length !== 1 ? "s" : ""} extracted
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {session.listings.map((listing, i) => (
              <ListingCard key={i} listing={listing} />
            ))}
          </div>
        </div>
      )}

      {/* Rendered markdown — same styling as StreamingReport */}
      <div className="px-5 py-5 max-w-none text-foreground space-y-1">
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
            table: ({ children }) => (
              <div className="my-4 rounded-lg border border-border overflow-hidden">
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
            td: ({ children }) => (
              <td className="px-4 py-3 align-top text-sm text-foreground">{children}</td>
            ),
          }}
        >
          {session.report.content}
        </ReactMarkdown>
      </div>

      {/* Sources */}
      {session.sources.length > 0 && (
        <div className="border-t border-border px-5 py-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Sources ({session.sources.length})
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {session.sources.map((source, i) => (
              <a
                key={i}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 group rounded-md p-2 hover:bg-secondary transition-colors"
              >
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

// ── Main component ────────────────────────────────────────────────────────────
export function ResearchHistory() {
  const [sessions, setSessions] = useState<ResearchSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await fetch("/api/history");
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch {
      toast.error("Couldn't load history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const deleteSession = async (id: string) => {
    await fetch(`/api/history?id=${id}`, { method: "DELETE" });
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (expanded === id) setExpanded(null);
    toast.success("Research deleted", {
      action: { label: "Refresh", onClick: load },
    });
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 py-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center mb-4">
          <Clock className="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">No research yet</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
          Start researching a topic and it will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((session) => (
        <div key={session.id} className="rounded-lg border border-border bg-card overflow-hidden">
          {/* Session header row */}
          <div
            className="flex items-start gap-3 p-4 cursor-pointer hover:bg-secondary/50 transition-colors"
            onClick={() => setExpanded(expanded === session.id ? null : session.id)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-xs border",
                    session.status === "completed" && "bg-success/10 text-success border-success/20",
                    session.status === "failed"    && "bg-destructive/10 text-destructive border-destructive/20",
                    session.status === "running"   && "bg-warning/10 text-warning border-warning/20"
                  )}
                >
                  {session.status}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(session.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {session.sources.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    · {session.sources.length} sources
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-foreground line-clamp-2">
                {session.query}
              </p>
            </div>

            <div className="flex items-center gap-1 shrink-0 mt-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
              {expanded === session.id
                ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                : <ChevronDown className="h-4 w-4 text-muted-foreground" />
              }
            </div>
          </div>

          {/* Full report — rendered when expanded */}
          {expanded === session.id && <FullReport session={session} />}
        </div>
      ))}
    </div>
  );
}
