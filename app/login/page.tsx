"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, Loader2, Eye, EyeOff, Search, FileText, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const FEATURES = [
  { icon: Globe,    label: "Web Search",     desc: "Searches the web using Tavily AI" },
  { icon: Search,   label: "Smart Scraping", desc: "Reads and extracts data from pages" },
  { icon: FileText, label: "Auto Reports",   desc: "Generates structured markdown reports" },
];

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername]       = useState("");
  const [password, setPassword]       = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Login failed"); return; }
      toast.success("Welcome back!");
      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">

      {/* ── Left panel — branding ─────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 bg-foreground flex-col justify-between p-12">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-background/10 flex items-center justify-center">
            <Zap className="h-4 w-4 text-background" />
          </div>
          <span className="text-base font-semibold text-background">Research Agent</span>
        </div>

        {/* Center copy */}
        <div className="space-y-8">
          <div>
            <h2 className="text-4xl font-bold text-background leading-tight">
              AI-powered research,<br />done in seconds.
            </h2>
            <p className="text-background/60 mt-4 text-base leading-relaxed max-w-sm">
              Multi-agent system that searches the web, scrapes sources, and writes
              comprehensive reports — fully automated.
            </p>
          </div>

          <div className="space-y-4">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-center gap-4">
                <div className="h-9 w-9 rounded-lg bg-background/10 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-background" />
                </div>
                <div>
                  <p className="text-sm font-medium text-background">{label}</p>
                  <p className="text-xs text-background/50">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer credit */}
        <p className="text-xs text-background/40">
          Developed by{" "}
          <span className="text-background/70 font-medium">Yogesh Mahawar</span>
        </p>
      </div>

      {/* ── Right panel — form ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">

        {/* Mobile logo */}
        <div className="flex items-center gap-2 mb-10 lg:hidden">
          <div className="h-8 w-8 rounded-lg bg-foreground flex items-center justify-center">
            <Zap className="h-4 w-4 text-background" />
          </div>
          <span className="text-base font-semibold text-foreground">Research Agent</span>
        </div>

        <div className="w-full max-w-sm space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Welcome back</h1>
            <p className="text-sm text-muted-foreground mt-1">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                autoComplete="username"
                autoFocus
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={loading}
                  className="pe-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              type="submit"
              className="w-full"
              disabled={!username.trim() || !password || loading}
            >
              {loading
                ? <><Loader2 className="h-4 w-4 me-2 animate-spin" />Signing in...</>
                : "Sign in"
              }
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center">
            Contact your administrator to get an account.
          </p>
        </div>

        {/* Mobile footer credit */}
        <p className="absolute bottom-6 text-xs text-muted-foreground lg:hidden">
          Developed by <span className="text-foreground font-medium">Yogesh Mahawar</span>
        </p>
      </div>

    </div>
  );
}
