import { getAIClient, MODELS, calcCost } from "@/lib/ai-client";
import type { ModelUsage } from "@/types";

type AnalysisType = "trends" | "key_points" | "sentiment" | "comparison";

const MODEL = MODELS.analyst;

export async function analystAgent(
  content: string,
  analysisType: AnalysisType = "key_points"
): Promise<{ text: string; usage: ModelUsage }> {
  const openai = getAIClient();

  const prompts: Record<AnalysisType, string> = {
    trends: "Identify and explain the main trends and patterns. What is changing, growing, or declining?",
    key_points: "Extract the most important key points, facts, and insights.",
    sentiment: "Analyze the overall sentiment and tone. What are the main positive and negative aspects?",
    comparison: "Compare and contrast the different perspectives and viewpoints.",
  };

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content: "You are an expert research analyst. Provide clear, structured analysis. Use markdown formatting where helpful.",
      },
      {
        role: "user",
        content: `${prompts[analysisType]}\n\nContent:\n${content.slice(0, 5000)}`,
      },
    ],
    max_tokens: 800,
    temperature: 0.4,
  });

  const u = response.usage!;
  return {
    text: response.choices[0]?.message?.content || "Could not analyze.",
    usage: {
      model: MODEL,
      promptTokens: u.prompt_tokens,
      completionTokens: u.completion_tokens,
      totalTokens: u.total_tokens,
      costUsd: calcCost(MODEL, u.prompt_tokens, u.completion_tokens),
    },
  };
}
