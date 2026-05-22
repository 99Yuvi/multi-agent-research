import { getAIClient, MODELS, calcCost } from "@/lib/ai-client";
import type { ResearchSource, ModelUsage } from "@/types";

const MODEL = MODELS.reportWriter;

export async function reportWriterAgent(params: {
  topic: string;
  summaries: string[];
  analysis: string;
  sources: ResearchSource[];
}): Promise<{ text: string; usage: ModelUsage }> {
  const openai = getAIClient();
  const { topic, summaries, analysis, sources } = params;

  const sourcesText = sources
    .map((s, i) => `${i + 1}. [${s.title}](${s.url})`)
    .join("\n");

  const summariesText = summaries
    .map((s, i) => `### Source ${i + 1}\n${s}`)
    .join("\n\n");

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content: `You are an expert research report writer. Write comprehensive, well-structured reports in Markdown format.

Report structure:
1. # Executive Summary (2-3 sentences overview)
2. ## Key Findings (bullet points — factual only)
3. ## Detailed Analysis (3-5 paragraphs with depth)
4. ## Trends & Insights
5. ## Conclusion
6. ## Sources

CRITICAL RULES — follow strictly:
- NEVER fabricate or guess phone numbers, contact details, prices, or addresses. Only include data explicitly present in the sources.
- If contact information was provided in the extracted data, you may reference it — but NEVER invent numbers that aren't in the summaries.
- If a listing query (hotels, restaurants etc.) is being researched, DO NOT reproduce a contact table in the report — a structured card view is already shown separately. Focus the report on analysis, context, and insights instead.
- Use clear headings, bullet points where appropriate, and ensure factual accuracy.`,
      },
      {
        role: "user",
        content: `Write a comprehensive research report on: "${topic}"

SUMMARIES FROM SOURCES:
${summariesText}

ANALYSIS:
${analysis}

SOURCES:
${sourcesText}`,
      },
    ],
    max_tokens: 2000,
    temperature: 0.5,
  });

  const u = response.usage!;
  return {
    text: response.choices[0]?.message?.content || "Could not generate report.",
    usage: {
      model: MODEL,
      promptTokens: u.prompt_tokens,
      completionTokens: u.completion_tokens,
      totalTokens: u.total_tokens,
      costUsd: calcCost(MODEL, u.prompt_tokens, u.completion_tokens),
    },
  };
}
