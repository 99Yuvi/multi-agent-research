import type OpenAI from "openai";

export const AGENT_TOOLS: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "search",
      description:
        "Search the web using Tavily Search API to find relevant information and URLs.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query to look up",
          },
          max_results: {
            type: "number",
            description: "Maximum number of results to return (default: 5)",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "scrape_url",
      description:
        "Scrape and extract the full text content from a given URL.",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "The URL to scrape content from",
          },
        },
        required: ["url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "summarize",
      description: "Summarize a piece of text content.",
      parameters: {
        type: "object",
        properties: {
          content: {
            type: "string",
            description: "The text content to summarize",
          },
          style: {
            type: "string",
            enum: ["brief", "detailed", "bullet-points"],
            description: "The style of summary to produce",
          },
        },
        required: ["content", "style"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "analyze",
      description:
        "Analyze content to extract trends, key insights, or sentiment.",
      parameters: {
        type: "object",
        properties: {
          content: {
            type: "string",
            description: "The content to analyze",
          },
          analysis_type: {
            type: "string",
            enum: ["trends", "key_points", "sentiment", "comparison"],
            description: "The type of analysis to perform",
          },
        },
        required: ["content", "analysis_type"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_report",
      description:
        "Generate a comprehensive, well-structured research report from all gathered data.",
      parameters: {
        type: "object",
        properties: {
          topic: {
            type: "string",
            description: "The research topic",
          },
          summaries: {
            type: "array",
            items: { type: "string" },
            description: "Array of content summaries from different sources",
          },
          analysis: {
            type: "string",
            description: "The analysis and insights extracted",
          },
          sources: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                url: { type: "string" },
              },
            },
            description: "List of sources used",
          },
        },
        required: ["topic", "summaries", "analysis", "sources"],
      },
    },
  },
];
