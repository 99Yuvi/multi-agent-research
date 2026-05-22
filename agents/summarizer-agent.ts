import { getAIClient, MODELS, calcCost } from "@/lib/ai-client";
import type { ModelUsage } from "@/types";

const MODEL = MODELS.summarizer;

export async function summarizerAgent(
  content: string,
  style: "brief" | "detailed" | "bullet-points" = "detailed"
): Promise<{ text: string; usage: ModelUsage }> {
  const openai = getAIClient();

  const styleInstructions = {
    brief: "Write a 2-3 sentence summary.",
    detailed: "Write a thorough 2-3 paragraph summary.",
    "bullet-points": "Write 5-8 key bullet points.",
  };

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content: `You are a research summarizer. ${styleInstructions[style]} Focus on facts and insights. Be concise and accurate.`,
      },
      {
        role: "user",
        content: `Summarize this content:\n\n${content.slice(0, 4000)}`,
      },
    ],
    max_tokens: 500,
    temperature: 0.3,
  });

  const u = response.usage!;
  return {
    text: response.choices[0]?.message?.content || "Could not summarize.",
    usage: {
      model: MODEL,
      promptTokens: u.prompt_tokens,
      completionTokens: u.completion_tokens,
      totalTokens: u.total_tokens,
      costUsd: calcCost(MODEL, u.prompt_tokens, u.completion_tokens),
    },
  };
}
