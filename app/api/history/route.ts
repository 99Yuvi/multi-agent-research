import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const sessions = await prisma.researchSession.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      report: { select: { content: true } },
      sources: { select: { title: true, url: true, snippet: true } },
    },
  });

  return NextResponse.json({ sessions });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  await prisma.researchSession.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
