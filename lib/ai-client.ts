/**
 * AI Client factory
 * Set USE_GROQ=true in .env.local to use Groq (free) instead of OpenAI.
 *
 * Groq free tier models with tool calling support:
 *   - llama-3.3-70b-versatile   → replaces gpt-4o       (orchestrator, report writer)
 *   - llama-3.1-8b-instant      → replaces gpt-4o-mini  (summarizer, analyst)
 *
 * OpenAI models (paid):
 *   - gpt-4o                    → orchestrator, report writer
 *   - gpt-4o-mini               → summarizer, analyst
 */

import OpenAI from "openai";

const useGroq = process.env.USE_GROQ === "true";

// Both Groq and OpenAI expose an OpenAI-compatible REST API,
// so we can use the OpenAI SDK for both — just swap base URL + key.
export function getAIClient() {
  if (useGroq) {
    return new OpenAI({
      apiKey: process.env.GROQ_API_KEY || "",
      baseURL: "https://api.groq.com/openai/v1",
    });
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });
}

// Model names per role
export const MODELS = useGroq
  ? {
      orchestrator: "llama-3.3-70b-versatile", // best Groq model for tool use
      summarizer:   "llama-3.1-8b-instant",    // fast + free
      analyst:      "llama-3.1-8b-instant",
      reportWriter: "llama-3.3-70b-versatile",
    }
  : {
      orchestrator: "gpt-4o",
      summarizer:   "gpt-4o-mini",
      analyst:      "gpt-4o-mini",
      reportWriter: "gpt-4o",
    };

// Pricing per 1M tokens (input / output)
// Groq free tier = $0 during dev, but let's track approximate paid pricing for reference
export const PRICING: Record<string, { input: number; output: number }> = {
  // OpenAI
  "gpt-4o":            { input: 2.50,  output: 10.00 },
  "gpt-4o-mini":       { input: 0.15,  output: 0.60  },
  // Groq (pay-as-you-go rates, free tier = $0)
  "llama-3.3-70b-versatile": { input: 0.59,  output: 0.79  },
  "llama-3.1-8b-instant":    { input: 0.05,  output: 0.08  },
};

export function calcCost(model: string, promptTokens: number, completionTokens: number): number {
  const p = PRICING[model] ?? { input: 0, output: 0 };
  return (promptTokens * p.input + completionTokens * p.output) / 1_000_000;
}

export const IS_GROQ = useGroq;
