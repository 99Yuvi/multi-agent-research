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
      // Content is fetched server-side from the scraped URL — pass only the url and style.
      description: "Summarize the scraped content from a URL. Pass the url you scraped earlier.",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "The URL whose content should be summarized",
          },
          style: {
            type: "string",
            enum: ["brief", "detailed", "bullet-points"],
            description: "The style of summary to produce",
          },
        },
        required: ["url", "style"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "analyze",
      // Analysis runs on all summaries stored server-side — no content arg needed.
      description: "Analyze all collected summaries to extract key insights. Call this once after all summarize calls are done.",
      parameters: {
        type: "object",
        properties: {
          analysis_type: {
            type: "string",
            enum: ["trends", "key_points", "sentiment", "comparison"],
            description: "The type of analysis to perform",
          },
        },
        required: ["analysis_type"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_report",
      // Summaries and analysis are stored server-side — LLM only passes topic.
      // This prevents large JSON in tool call args which causes Groq 400 errors.
      description:
        "Signal that all research is complete and the final report should be generated. Call this after summarize and analyze are done.",
      parameters: {
        type: "object",
        properties: {
          topic: {
            type: "string",
            description: "The research topic being reported on",
          },
        },
        required: ["topic"],
      },
    },
  },
];
