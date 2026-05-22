import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function summarizerAgent(
  content: string,
  style: "brief" | "detailed" | "bullet-points" = "detailed"
): Promise<string> {
  const styleInstructions = {
    brief: "Write a 2-3 sentence summary.",
    detailed: "Write a thorough 2-3 paragraph summary.",
    "bullet-points": "Write 5-8 key bullet points.",
  };

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
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

  return response.choices[0]?.message?.content || "Could not summarize.";
}
