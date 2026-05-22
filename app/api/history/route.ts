import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const SESSION_INCLUDE = {
  report:   { select: { content: true } },
  sources:  { select: { title: true, url: true, snippet: true } },
  listings: { select: { name: true, price: true, phone: true, address: true, rating: true, website: true, image: true, notes: true } },
  user:     { select: { username: true, role: true } },
} as const;

export async function GET(req: NextRequest) {
  try {
    const auth = await getSession();
    if (!auth) return NextResponse.json({ sessions: [] });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    // Single session fetch
    if (id) {
      const where = auth.role === "admin" ? { id } : { id, userId: auth.id };
      const session = await prisma.researchSession.findFirst({ where, include: SESSION_INCLUDE });
      if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ session });
    }

    // List — admin sees all, user sees own
    const where = auth.role === "admin" ? {} : { userId: auth.id };
    const sessions = await prisma.researchSession.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { id: true, query: true, status: true, createdAt: true, userId: true,
                user: { select: { username: true } } },
    });
    return NextResponse.json({ sessions });
  } catch (err) {
    console.error("[history GET]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load history", sessions: [] },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  await prisma.researchSession.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
