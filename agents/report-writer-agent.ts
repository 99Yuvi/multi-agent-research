import OpenAI from "openai";
import type { ResearchSource } from "@/types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function reportWriterAgent(params: {
  topic: string;
  summaries: string[];
  analysis: string;
  sources: ResearchSource[];
}): Promise<string> {
  const { topic, summaries, analysis, sources } = params;

  const sourcesText = sources
    .map((s, i) => `${i + 1}. [${s.title}](${s.url})`)
    .join("\n");

  const summariesText = summaries
    .map((s, i) => `### Source ${i + 1}\n${s}`)
    .join("\n\n");

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are an expert research report writer. Write comprehensive, well-structured reports in Markdown format.

Report structure:
1. # Executive Summary (2-3 sentences)
2. ## Key Findings (bullet points)
3. ## Detailed Analysis (3-5 paragraphs)
4. ## Trends & Insights
5. ## Conclusion
6. ## Sources

Use clear headings, bullet points where appropriate, and ensure factual accuracy based on the provided information.`,
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

  return response.choices[0]?.message?.content || "Could not generate report.";
}
