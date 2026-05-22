import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type AnalysisType = "trends" | "key_points" | "sentiment" | "comparison";

export async function analystAgent(
  content: string,
  analysisType: AnalysisType = "key_points"
): Promise<string> {
  const prompts: Record<AnalysisType, string> = {
    trends:
      "Identify and explain the main trends and patterns in the following content. What is changing, growing, or declining?",
    key_points:
      "Extract the most important key points, facts, and insights from the following content.",
    sentiment:
      "Analyze the overall sentiment and tone of the following content. What are the main positive and negative aspects?",
    comparison:
      "Compare and contrast the different perspectives and viewpoints present in the following content.",
  };

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are an expert research analyst. Provide clear, structured analysis. Use markdown formatting where helpful.",
      },
      {
        role: "user",
        content: `${prompts[analysisType]}\n\nContent:\n${content.slice(0, 5000)}`,
      },
    ],
    max_tokens: 800,
    temperature: 0.4,
  });

  return response.choices[0]?.message?.content || "Could not analyze.";
}
