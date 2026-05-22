import Link from "next/link";
import { History, Zap, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResearchInput } from "@/components/ResearchInput";
import { AgentActivityPanel } from "@/components/AgentActivityPanel";
import { StreamingReport } from "@/components/StreamingReport";
import { TokenUsagePanel } from "@/components/TokenUsagePanel";
import { HowItWorks } from "@/components/HowItWorks";
import { ListingsPanel } from "@/components/ListingsPanel";
import { UserMenu } from "@/components/UserMenu";
import { getSession } from "@/lib/auth";

export default async function Home() {
  const session = await getSession();

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
          <Link href="/"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm bg-secondary text-foreground border border-border">
            <Zap className="h-4 w-4" />
            New Research
          </Link>
          <Link href="/history"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
            <History className="h-4 w-4" />
            History
          </Link>
          {session?.role === "admin" && (
            <Link href="/admin"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
              <ShieldCheck className="h-4 w-4" />
              User Management
            </Link>
          )}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-border space-y-3">
          <UserMenu username={session?.username ?? ""} role={session?.role ?? "user"} />
          <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-3">
            <p className="text-xs font-medium text-indigo-900 mb-0.5">Multi-Agent System</p>
            <p className="text-xs text-indigo-700">7 AI agents work together to research any topic.</p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 shrink-0 border-b border-border flex items-center px-6 gap-4">
          <h1 className="text-xl font-semibold text-foreground">Research</h1>
          <div className="ms-auto flex items-center gap-2">
            <Link href="/history">
              <Button variant="outline" size="sm" className="gap-2">
                <History className="h-4 w-4" />
                History
              </Button>
            </Link>
          </div>
        </header>

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
      </div>
    </div>
  );
}
