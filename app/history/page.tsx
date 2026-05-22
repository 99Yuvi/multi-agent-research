import Link from "next/link";
import { ArrowLeft, Zap, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResearchHistory } from "@/components/ResearchHistory";

export default function HistoryPage() {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-e border-border flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border gap-2">
          <div className="h-7 w-7 rounded-lg bg-foreground flex items-center justify-center">
            <Zap className="h-4 w-4 text-background" />
          </div>
          <span className="text-base font-semibold text-foreground">Research Agent</span>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <Zap className="h-4 w-4" />
            New Research
          </Link>
          <Link
            href="/history"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm bg-secondary text-foreground border border-border"
          >
            <History className="h-4 w-4" />
            History
          </Link>
        </nav>

        <div className="p-4 border-t border-border">
          <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-3">
            <p className="text-xs font-medium text-indigo-900 mb-0.5">Multi-Agent System</p>
            <p className="text-xs text-indigo-700">
              6 AI agents work together to research any topic autonomously.
            </p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 shrink-0 border-b border-border flex items-center px-6 gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="me-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold text-foreground">Research History</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto">
            <ResearchHistory />
          </div>
        </main>
      </div>
    </div>
  );
}
