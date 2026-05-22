"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Zap, ArrowLeft, Plus, Trash2,
  ShieldCheck, User, Loader2, Eye, EyeOff,
  Pencil, Check, X, History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface UserRow {
  id: string;
  username: string;
  role: string;
  createdAt: string;
  _count: { sessions: number };
}

// ── Inline edit row ───────────────────────────────────────────────────────────
function EditRow({
  user,
  onSave,
  onCancel,
}: {
  user: UserRow;
  onSave: (updated: UserRow) => void;
  onCancel: () => void;
}) {
  const [username, setUsername]   = useState(user.username);
  const [password, setPassword]   = useState("");
  const [role, setRole]           = useState<"admin" | "user">(user.role as "admin" | "user");
  const [showPw, setShowPw]       = useState(false);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");

  const save = async () => {
    setSaving(true);
    setError("");

    const body: Record<string, string> = { role };
    if (username.trim() !== user.username) body.username = username.trim();
    if (password)                          body.password = password;

    const res = await fetch(`/api/admin/users?id=${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) { setError(data.error || "Failed to save"); return; }

    toast.success(`"${data.user.username}" updated`);
    onSave({ ...user, ...data.user });
  };

  return (
    <div className="px-5 py-4 bg-secondary/30 border-b border-border space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Username */}
        <div className="space-y-1.5">
          <Label className="text-xs">Username</Label>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="h-8 text-sm"
            disabled={saving}
          />
        </div>

        {/* Role */}
        <div className="space-y-1.5">
          <Label className="text-xs">Role</Label>
          <div className="flex gap-2">
            {(["user", "admin"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1 h-8 rounded-md border text-xs font-medium transition-colors",
                  role === r
                    ? "bg-foreground text-background border-foreground"
                    : "border-border text-muted-foreground hover:bg-secondary"
                )}
              >
                {r === "admin" ? <ShieldCheck className="h-3 w-3" /> : <User className="h-3 w-3" />}
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* New password */}
      <div className="space-y-1.5">
        <Label className="text-xs">New Password <span className="text-muted-foreground font-normal">(leave blank to keep current)</span></Label>
        <div className="relative">
          <Input
            type={showPw ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter new password..."
            className="h-8 text-sm pe-9"
            disabled={saving}
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute end-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            tabIndex={-1}
          >
            {showPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={onCancel} disabled={saving} className="h-8 gap-1.5">
          <X className="h-3.5 w-3.5" />Cancel
        </Button>
        <Button size="sm" onClick={save} disabled={saving} className="h-8 gap-1.5">
          {saving
            ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Saving...</>
            : <><Check className="h-3.5 w-3.5" />Save Changes</>
          }
        </Button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers]         = useState<UserRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Create form
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole]         = useState<"user" | "admin">("user");
  const [showPw, setShowPw]           = useState(false);
  const [creating, setCreating]       = useState(false);
  const [formError, setFormError]     = useState("");

  const load = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.status === 403) { router.push("/"); return; }
      const data = await res.json();
      setUsers(data.users || []);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword) return;
    setCreating(true);
    setFormError("");

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: newUsername.trim(), password: newPassword, role: newRole }),
    });
    const data = await res.json();

    if (!res.ok) { setFormError(data.error || "Failed to create user"); setCreating(false); return; }

    toast.success(`User "${data.user.username}" created`);
    setNewUsername(""); setNewPassword(""); setNewRole("user");
    setCreating(false);
    load();
  };

  const deleteUser = async (id: string, name: string) => {
    const res = await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error); return; }
    toast.success(`"${name}" deleted`, { action: { label: "Refresh", onClick: load } });
    setUsers((prev) => prev.filter((u) => u.id !== id));
    if (editingId === id) setEditingId(null);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar — desktop only */}
      <aside className="hidden md:flex w-64 shrink-0 border-e border-border flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border gap-2">
          <div className="h-7 w-7 rounded-lg bg-foreground flex items-center justify-center">
            <Zap className="h-4 w-4 text-background" />
          </div>
          <span className="text-base font-semibold text-foreground">Research Agent</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <Link href="/" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
            <Zap className="h-4 w-4" />New Research
          </Link>
          <Link href="/admin" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm bg-secondary text-foreground border border-border">
            <ShieldCheck className="h-4 w-4" />User Management
          </Link>
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-14 shrink-0 border-b border-border flex items-center px-4 gap-3">
          <Link href="/"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <h1 className="text-base sm:text-xl font-semibold text-foreground">User Management</h1>
          <Badge variant="secondary" className="border border-border">
            <ShieldCheck className="h-3 w-3 me-1" />Admin
          </Badge>
        </header>

        <main className="flex-1 overflow-y-auto p-3 sm:p-6">
          <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">

            {/* ── Create user ──────────────────────────────────────────── */}
            <div className="rounded-lg border border-border bg-card p-5">
              <h2 className="text-base font-semibold text-foreground mb-4">Create New User</h2>
              <form onSubmit={createUser} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-username">Username</Label>
                    <Input id="new-username" value={newUsername} onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="e.g. john_doe" disabled={creating} />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <div className="flex gap-2">
                      {(["user", "admin"] as const).map((r) => (
                        <button key={r} type="button" onClick={() => setNewRole(r)}
                          className={cn(
                            "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border text-sm font-medium transition-colors",
                            newRole === r ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:bg-secondary"
                          )}>
                          {r === "admin" ? <ShieldCheck className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">Password</Label>
                  <div className="relative">
                    <Input id="new-password" type={showPw ? "text" : "password"} value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)} placeholder="Min. 6 characters"
                      disabled={creating} className="pe-10" />
                    <button type="button" onClick={() => setShowPw((v) => !v)} tabIndex={-1}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {formError && <p className="text-sm text-destructive">{formError}</p>}

                <div className="flex justify-end">
                  <Button type="submit" disabled={!newUsername.trim() || !newPassword || creating} className="gap-2">
                    {creating
                      ? <><Loader2 className="h-4 w-4 animate-spin" />Creating...</>
                      : <><Plus className="h-4 w-4" />Create User</>
                    }
                  </Button>
                </div>
              </form>
            </div>

            {/* ── Users list ───────────────────────────────────────────── */}
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">All Users</p>
                <span className="text-xs text-muted-foreground">{users.length} total</span>
              </div>

              {loading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-1.5 flex-1">
                        <Skeleton className="h-3.5 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : users.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-sm text-muted-foreground">No users yet</p>
                </div>
              ) : (
                <div>
                  {users.map((user) => (
                    <div key={user.id}>
                      {/* User row */}
                      <div className="flex items-center gap-3 px-5 py-3 hover:bg-secondary/30 transition-colors">
                        <div className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0",
                          user.role === "admin" ? "bg-foreground text-background" : "bg-secondary text-muted-foreground"
                        )}>
                          {user.username[0].toUpperCase()}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground">{user.username}</p>
                            <Badge variant="secondary" className={cn(
                              "text-xs border",
                              user.role === "admin"
                                ? "bg-foreground/10 text-foreground border-foreground/20"
                                : "bg-secondary text-muted-foreground border-border"
                            )}>
                              {user.role === "admin" && <ShieldCheck className="h-3 w-3 me-1" />}
                              {user.role}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {user._count.sessions} session{user._count.sessions !== 1 ? "s" : ""} ·
                            {" "}Joined {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {/* Edit toggle */}
                          <Button
                            variant="ghost" size="icon"
                            className={cn(
                              "h-8 w-8 transition-colors",
                              editingId === user.id
                                ? "text-foreground bg-secondary"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                            onClick={() => setEditingId(editingId === user.id ? null : user.id)}
                            title="Edit user"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>

                          {/* Delete */}
                          <Button
                            variant="ghost" size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => deleteUser(user.id, user.username)}
                            title="Delete user"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Inline edit form — expands below the row */}
                      {editingId === user.id && (
                        <EditRow
                          user={user}
                          onSave={(updated) => {
                            setUsers((prev) => prev.map((u) => u.id === updated.id ? updated : u));
                            setEditingId(null);
                          }}
                          onCancel={() => setEditingId(null)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />
            <p className="text-xs text-muted-foreground text-center">
              Admins see all research history · Users see only their own
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
