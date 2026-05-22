import OpenAI from "openai";
import { AGENT_TOOLS } from "./tools";
import { searchAgent } from "./search-agent";
import { scraperAgent } from "./scraper-agent";
import { summarizerAgent } from "./summarizer-agent";
import { analystAgent } from "./analyst-agent";
import { reportWriterAgent } from "./report-writer-agent";
import type { AgentName, SSEMessage, ResearchSource } from "@/types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type SendFn = (msg: SSEMessage) => void;

export async function runResearch(query: string, send: SendFn): Promise<string> {
  const sources: ResearchSource[] = [];
  const summaries: string[] = [];
  let analysisResult = "";

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `You are an expert research orchestrator. When given a research query, you:
1. Search for relevant information using the search tool (2-3 searches)
2. Scrape the top 3-4 most relevant URLs for detailed content
3. Summarize each scraped page with style "detailed"
4. Analyze all summaries combined with analysis_type "key_points"
5. Generate a comprehensive research report

Always complete all 5 steps in order. Be thorough but efficient.`,
    },
    { role: "user", content: `Research this topic thoroughly: "${query}"` },
  ];

  send({ type: "agent_start", agent: "orchestrator", message: "Planning research strategy..." });

  let iterations = 0;
  const MAX_ITERATIONS = 20;

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      tools: AGENT_TOOLS,
      tool_choice: "auto",
      messages,
      max_tokens: 1000,
    });

    const choice = response.choices[0];
    const msg = choice.message;

    messages.push(msg);

    // If no tool calls, orchestrator is done
    if (!msg.tool_calls || msg.tool_calls.length === 0) {
      send({ type: "agent_done", agent: "orchestrator" });

      // Return the final text if any
      return msg.content || "";
    }

    // Process each tool call
    for (const toolCall of msg.tool_calls) {
      if (toolCall.type !== "function") continue;
      const toolName = toolCall.function.name;
      let args: Record<string, unknown>;

      try {
        args = JSON.parse(toolCall.function.arguments);
      } catch {
        args = {};
      }

      let result: unknown;

      if (toolName === "search") {
        const agentLabel = "search" as AgentName;
        send({ type: "agent_start", agent: agentLabel, message: `Searching: "${args.query}"` });

        const searchResult = await searchAgent(
          args.query as string,
          (args.max_results as number) || 5
        );

        // Collect sources
        searchResult.results.forEach((r) => {
          if (!sources.find((s) => s.url === r.url)) {
            sources.push({ title: r.title, url: r.url, snippet: r.snippet });
          }
        });

        result = searchResult;
        send({ type: "agent_done", agent: agentLabel, message: `Found ${searchResult.results.length} results` });

      } else if (toolName === "scrape_url") {
        const agentLabel = "scraper" as AgentName;
        send({ type: "agent_start", agent: agentLabel, message: `Reading: ${args.url}` });

        const scraped = await scraperAgent(args.url as string);
        result = scraped;

        send({ type: "agent_done", agent: agentLabel, message: `Read ${scraped.wordCount} words` });

      } else if (toolName === "summarize") {
        const agentLabel = "summarizer" as AgentName;
        send({ type: "agent_start", agent: agentLabel, message: "Summarizing content..." });

        const summary = await summarizerAgent(
          args.content as string,
          (args.style as "brief" | "detailed" | "bullet-points") || "detailed"
        );
        summaries.push(summary);
        result = summary;

        send({ type: "agent_done", agent: agentLabel });

      } else if (toolName === "analyze") {
        const agentLabel = "analyst" as AgentName;
        send({ type: "agent_start", agent: agentLabel, message: "Analyzing insights..." });

        const analysis = await analystAgent(
          args.content as string,
          (args.analysis_type as "trends" | "key_points" | "sentiment" | "comparison") || "key_points"
        );
        analysisResult = analysis;
        result = analysis;

        send({ type: "agent_done", agent: agentLabel });

      } else if (toolName === "generate_report") {
        const agentLabel = "report_writer" as AgentName;
        send({ type: "agent_start", agent: agentLabel, message: "Writing research report..." });

        const report = await reportWriterAgent({
          topic: (args.topic as string) || query,
          summaries: (args.summaries as string[]) || summaries,
          analysis: (args.analysis as string) || analysisResult,
          sources: (args.sources as ResearchSource[]) || sources,
        });

        // Stream the report in chunks
        const words = report.split(" ");
        for (let i = 0; i < words.length; i += 8) {
          const chunk = words.slice(i, i + 8).join(" ") + (i + 8 < words.length ? " " : "");
          send({ type: "chunk", content: chunk });
        }

        result = report;
        send({
          type: "complete",
          report,
          sources,
          agent: agentLabel,
        });

        return report;
      } else {
        result = { error: `Unknown tool: ${toolName}` };
      }

      // Add tool result to messages
      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(result),
      });
    }
  }

  throw new Error("Research exceeded maximum iterations");
}
