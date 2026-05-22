"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Zap, Plus, ShieldCheck, Trash2, MessageSquare,
  ExternalLink, Phone, MapPin, Star, IndianRupee, ImageOff,
  Copy, Download, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ResearchInput } from "@/components/ResearchInput";
import { AgentActivityPanel } from "@/components/AgentActivityPanel";
import { StreamingReport } from "@/components/StreamingReport";
import { TokenUsagePanel } from "@/components/TokenUsagePanel";
import { ListingsPanel } from "@/components/ListingsPanel";
import { HowItWorks } from "@/components/HowItWorks";
import { UserMenu } from "@/components/UserMenu";
import { useResearchStore } from "@/store/researchStore";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ExtractedListing, ResearchSource } from "@/types";

interface SessionSummary {
  id: string;
  query: string;
  status: string;
  createdAt: string;
  user?: { username: string };
}

interface SessionDetail {
  id: string;
  query: string;
  status: string;
  createdAt: string;
  report?: { content: string };
  sources: ResearchSource[];
  listings: ExtractedListing[];
  user?: { username: string };
}

// ── Date grouping ─────────────────────────────────────────────────────────────
function groupByDate(sessions: SessionSummary[]) {
  const now  = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86400000;
  const week      = today - 6 * 86400000;

  const groups: Record<string, SessionSummary[]> = {
    Today: [], Yesterday: [], "Last 7 Days": [], Older: [],
  };

  sessions.forEach((s) => {
    const t = new Date(s.createdAt).getTime();
    if (t >= today)         groups["Today"].push(s);
    else if (t >= yesterday) groups["Yesterday"].push(s);
    else if (t >= week)      groups["Last 7 Days"].push(s);
    else                     groups["Older"].push(s);
  });

  return Object.entries(groups).filter(([, items]) => items.length > 0);
}

// ── Listing card (for past-session view) ─────────────────────────────────────
function ListingCard({ listing }: { listing: ExtractedListing }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="rounded-lg border border-border bg-background overflow-hidden flex flex-col">
      {listing.image && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={listing.image} alt={listing.name} className="h-36 w-full object-cover" onError={() => setFailed(true)} />
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
            {listing.price.replace("₹","").replace("Rs","").trim()}
          </span>
        )}
        {listing.rating && (
          <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />{listing.rating}
          </span>
        )}
        {listing.address && (
          <span className="inline-flex items-start gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 mt-0.5 shrink-0" /><span className="line-clamp-2">{listing.address}</span>
          </span>
        )}
        <div className="mt-auto pt-2 border-t border-border">
          {listing.phone ? (
            <a href={`tel:${listing.phone.replace(/\s/g,"")}`}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium">
              <Phone className="h-3 w-3" />{listing.phone}
            </a>
          ) : listing.website ? (
            <a href={listing.website} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-border bg-secondary hover:bg-secondary/80 text-foreground font-medium transition-colors">
              <ExternalLink className="h-3 w-3" />Book Online
            </a>
          ) : (
            <span className="text-xs text-muted-foreground italic">Contact not available</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Past session viewer ───────────────────────────────────────────────────────
function SessionViewer({ sessionId }: { sessionId: string }) {
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied]   = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/history?id=${sessionId}`)
      .then((r) => r.json())
      .then((d) => setSession(d.session ?? null))
      .catch(() => toast.error("Failed to load session"))
      .finally(() => setLoading(false));
  }, [sessionId]);

  const copy = async () => {
    if (!session?.report) return;
    await navigator.clipboard.writeText(session.report.content);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const download = () => {
    if (!session?.report) return;
    const filename = `research-${session.query.slice(0,30).replace(/\s+/g,"-").toLowerCase()}.md`;
    const blob = new Blob([`# ${session.query}\n\n${session.report.content}`], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded", { description: filename });
  };

  if (loading) return (
    <div className="max-w-3xl mx-auto space-y-4 p-6">
      <Skeleton className="h-7 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-4/6" />
    </div>
  );

  if (!session) return (
    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
      Session not found.
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Query title */}
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-xl font-semibold text-foreground leading-snug">{session.query}</h2>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={copy} className="gap-1.5 h-8 text-xs">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button variant="outline" size="sm" onClick={download} className="gap-1.5 h-8 text-xs">
              <Download className="h-3.5 w-3.5" />Download
            </Button>
          </div>
        </div>

        {/* Listings */}
        {session.listings.length > 0 && (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {session.listings.length} Listings Extracted
              </p>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {session.listings.map((l, i) => <ListingCard key={i} listing={l} />)}
            </div>
          </div>
        )}

        {/* Report */}
        {session.report && (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="px-5 py-4">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => <h1 className="text-2xl font-semibold text-foreground mb-4 mt-0 pb-2 border-b border-border">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-lg font-semibold text-foreground mb-3 mt-6">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-base font-semibold text-foreground mb-2 mt-4">{children}</h3>,
                  p:  ({ children }) => <p className="text-sm text-foreground mb-3 leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc ps-5 mb-3 space-y-1 text-sm">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal ps-5 mb-3 space-y-1 text-sm">{children}</ol>,
                  li: ({ children }) => <li className="text-sm text-foreground leading-relaxed">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                  a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4 text-sm">{children}</a>,
                  blockquote: ({ children }) => <blockquote className="border-s-2 border-border ps-4 text-muted-foreground italic my-3 text-sm">{children}</blockquote>,
                  hr: () => <hr className="border-border my-4" />,
                  table: ({ children }) => (
                    <div className="my-4 rounded-lg border border-border overflow-hidden">
                      <div className="overflow-x-auto"><table className="w-full text-sm">{children}</table></div>
                    </div>
                  ),
                  thead: ({ children }) => <thead className="bg-secondary/60 border-b border-border">{children}</thead>,
                  tbody: ({ children }) => <tbody className="divide-y divide-border">{children}</tbody>,
                  tr:   ({ children }) => <tr className="hover:bg-secondary/30 transition-colors">{children}</tr>,
                  th:   ({ children }) => <th className="px-4 py-2.5 text-start text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{children}</th>,
                  td:   ({ children }) => <td className="px-4 py-3 align-top text-sm text-foreground">{children}</td>,
                }}
              >
                {session.report.content}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {/* Sources */}
        {session.sources.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Sources ({session.sources.length})
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {session.sources.map((src, i) => (
                <a key={i} href={src.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-start gap-2 group rounded-md p-2 hover:bg-secondary transition-colors">
                  <div className="h-5 w-5 rounded bg-secondary flex items-center justify-center shrink-0 mt-0.5 text-xs text-muted-foreground font-medium">{i+1}</div>
                  <div className="min-w-0">
                    <p className="text-sm text-foreground group-hover:underline underline-offset-2 line-clamp-1 font-medium">{src.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{src.url}</p>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main layout ───────────────────────────────────────────────────────────────
interface Props {
  username: string;
  role: string;
}

export function ResearchLayout({ username, role }: Props) {
  const { isResearching, report, startResearch: storeStart } = useResearchStore();
  const store = useResearchStore();

  const [sessions, setSessions]       = useState<SessionSummary[]>([]);
  const [loadingSidebar, setLoadingSidebar] = useState(true);
  const [activeId, setActiveId]       = useState<string | null>(null);
  const [hoveredId, setHoveredId]     = useState<string | null>(null);
  const prevReportRef                 = useRef("");

  // Fetch sidebar list
  const loadSessions = async () => {
    try {
      const res  = await fetch("/api/history");
      const data = await res.json();
      setSessions(data.sessions ?? []);
    } catch { /* silent */ }
    finally { setLoadingSidebar(false); }
  };

  useEffect(() => { loadSessions(); }, []);

  // When a new report finishes streaming → add it to the top of sidebar
  useEffect(() => {
    if (!isResearching && report && report !== prevReportRef.current) {
      prevReportRef.current = report;
      loadSessions(); // refresh sidebar to include the just-saved session
    }
  }, [isResearching, report]);

  const handleNewResearch = () => {
    store.resetResearch();
    setActiveId(null);
  };

  const deleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await fetch(`/api/history?id=${id}`, { method: "DELETE" });
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeId === id) { setActiveId(null); store.resetResearch(); }
    toast.success("Deleted", { action: { label: "Refresh", onClick: loadSessions } });
  };

  const groups = groupByDate(sessions);

  // Decide what the main area shows
  const showingNewResearch = !activeId;

  return (
    <div className="flex h-screen bg-background overflow-hidden">

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className="w-64 shrink-0 border-e border-border flex flex-col bg-card">

        {/* Logo */}
        <div className="h-14 flex items-center px-4 gap-2 shrink-0">
          <div className="h-6 w-6 rounded-md bg-foreground flex items-center justify-center">
            <Zap className="h-3.5 w-3.5 text-background" />
          </div>
          <span className="text-sm font-semibold text-foreground">Research Agent</span>
        </div>

        {/* New Research button */}
        <div className="px-3 pb-2">
          <button
            onClick={handleNewResearch}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
              showingNewResearch && !isResearching && !report
                ? "bg-secondary text-foreground border border-border"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <Plus className="h-4 w-4 shrink-0" />
            New Research
          </button>
        </div>

        {/* Admin link */}
        {role === "admin" && (
          <div className="px-3 pb-2">
            <Link href="/admin"
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              User Management
            </Link>
          </div>
        )}

        {/* Session list */}
        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-4">
          {loadingSidebar ? (
            <div className="space-y-1 pt-2">
              {[1,2,3,4,5].map((i) => (
                <Skeleton key={i} className="h-8 w-full rounded-lg" />
              ))}
            </div>
          ) : groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
              <MessageSquare className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground">No research yet</p>
            </div>
          ) : (
            groups.map(([label, items]) => (
              <div key={label}>
                <p className="text-xs font-semibold text-muted-foreground px-2 mb-1">{label}</p>
                <div className="space-y-0.5">
                  {items.map((session) => (
                    <div
                      key={session.id}
                      onClick={() => { setActiveId(session.id); store.resetResearch(); }}
                      onMouseEnter={() => setHoveredId(session.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      className={cn(
                        "group relative flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors",
                        activeId === session.id
                          ? "bg-secondary text-foreground"
                          : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                      )}
                    >
                      <p className="text-sm leading-snug line-clamp-1 flex-1 pe-5">
                        {session.query}
                      </p>
                      {/* Admin label */}
                      {role === "admin" && session.user?.username && (
                        <span className="absolute end-6 text-[10px] text-muted-foreground/60 hidden group-hover:block truncate max-w-[60px]">
                          {session.user.username}
                        </span>
                      )}
                      {/* Delete on hover */}
                      {hoveredId === session.id && (
                        <button
                          onClick={(e) => deleteSession(e, session.id)}
                          className="absolute end-2 p-1 rounded hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* User menu */}
        <div className="border-t border-border p-3">
          <UserMenu username={username} role={role} />
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Topbar */}
        <header className="h-14 shrink-0 border-b border-border flex items-center px-6">
          <h1 className="text-base font-semibold text-foreground">
            {activeId ? "Research" : "New Research"}
          </h1>
        </header>

        {/* Content area */}
        {activeId ? (
          <SessionViewer sessionId={activeId} />
        ) : (
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="rounded-lg border border-border bg-card p-5">
                <h2 className="text-lg font-semibold text-foreground mb-1">
                  What do you want to research?
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  AI agents will search the web, read articles, and generate a comprehensive report.
                </p>
                <ResearchInput />
              </div>
              <HowItWorks />
              <AgentActivityPanel />
              <ListingsPanel />
              <TokenUsagePanel />
              <StreamingReport />
            </div>
          </main>
        )}
      </div>
    </div>
  );
}
