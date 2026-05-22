import { NextRequest, NextResponse } from "next/server";
import { runResearch } from "@/agents/orchestrator";
import { prisma } from "@/lib/prisma";
import type { SSEMessage } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const { query } = await req.json();

  if (!query?.trim()) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  // Create session in DB
  const session = await prisma.researchSession.create({
    data: { query: query.trim(), status: "running" },
  });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (msg: SSEMessage) => {
        const data = `data: ${JSON.stringify({ ...msg, sessionId: session.id })}\n\n`;
        controller.enqueue(encoder.encode(data));
      };

      // Send session id immediately so client can track
      send({ type: "agent_start", agent: "orchestrator", message: session.id } as SSEMessage & { message: string });

      try {
        const report = await runResearch(query.trim(), send);

        // Save report and update session
        await prisma.researchSession.update({
          where: { id: session.id },
          data: { status: "completed" },
        });

        if (report) {
          await prisma.report.create({
            data: { content: report, sessionId: session.id },
          });
        }
      } catch (err) {
        console.error("Research error:", err);
        send({
          type: "error",
          error: err instanceof Error ? err.message : "Research failed",
        });

        await prisma.researchSession.update({
          where: { id: session.id },
          data: { status: "failed" },
        });
      } finally {
        const done = `data: ${JSON.stringify({ type: "done" })}\n\n`;
        controller.enqueue(encoder.encode(done));
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
