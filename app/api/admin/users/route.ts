import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// ── Guard: admin only ──────────────────────────────────────────────────────
async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "admin") return null;
  return session;
}

// ── GET — list all users ───────────────────────────────────────────────────
export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      username: true,
      role: true,
      createdAt: true,
      _count: { select: { sessions: true } },
    },
  });

  return NextResponse.json({ users });
}

// ── POST — create user ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { username, password, role } = await req.json();

  if (!username?.trim() || !password) {
    return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { username: username.trim() } });
  if (existing) {
    return NextResponse.json({ error: "Username already exists" }, { status: 409 });
  }

  const hashed = await hash(password, 12);
  const user = await prisma.user.create({
    data: {
      username: username.trim(),
      password: hashed,
      role: role === "admin" ? "admin" : "user",
    },
    select: { id: true, username: true, role: true, createdAt: true },
  });

  return NextResponse.json({ user }, { status: 201 });
}

// ── PATCH — update username / password / role ─────────────────────────────
export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const { username, password, role } = await req.json();

  // Build update payload — only include fields that were sent
  const data: Record<string, string> = {};

  if (username?.trim()) {
    const conflict = await prisma.user.findFirst({
      where: { username: username.trim(), NOT: { id } },
    });
    if (conflict) {
      return NextResponse.json({ error: "Username already taken" }, { status: 409 });
    }
    data.username = username.trim();
  }

  if (password) {
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }
    data.password = await hash(password, 12);
  }

  if (role === "admin" || role === "user") {
    data.role = role;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, username: true, role: true, createdAt: true },
  });

  return NextResponse.json({ user: updated });
}

// ── DELETE — delete user ───────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  // Prevent admin from deleting themselves
  if (id === admin.id) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
