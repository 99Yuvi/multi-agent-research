"use client";

import { useEffect, useState } from "react";
import { Clock, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { ResearchSession } from "@/types";
import { cn } from "@/lib/utils";

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
          <div
            className="flex items-start gap-3 p-4 cursor-pointer hover:bg-secondary/50 transition-colors"
            onClick={() => setExpanded(expanded === session.id ? null : session.id)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge
                  variant={session.status === "completed" ? "secondary" : "secondary"}
                  className={cn(
                    "text-xs border",
                    session.status === "completed" &&
                      "bg-success/10 text-success border-success/20",
                    session.status === "failed" &&
                      "bg-destructive/10 text-destructive border-destructive/20",
                    session.status === "running" &&
                      "bg-warning/10 text-warning border-warning/20"
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
              </div>
              <p className="text-sm font-medium text-foreground line-clamp-2">
                {session.query}
              </p>
              {session.sources.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {session.sources.length} sources
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSession(session.id);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
              {expanded === session.id ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>

          {expanded === session.id && session.report && (
            <div className="border-t border-border p-4 bg-background">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Report Preview
              </p>
              <p className="text-sm text-foreground line-clamp-6 leading-relaxed">
                {session.report.content.replace(/#{1,6}\s/g, "").slice(0, 500)}...
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
