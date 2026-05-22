"use client";

import { useState, useRef } from "react";
import { Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useResearchStore } from "@/store/researchStore";
import { useResearch } from "@/hooks/useResearch";

const EXAMPLE_QUERIES = [
  "Latest trends in AI agents 2025",
  "How is generative AI transforming healthcare?",
  "Best practices for building SaaS products",
  "Impact of climate change on global economy",
];

export function ResearchInput() {
  const [input, setInput] = useState("");
  const { isResearching } = useResearchStore();
  const { startResearch } = useResearch();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (!input.trim() || isResearching) return;
    startResearch(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What do you want to research? (e.g. Latest trends in AI agents 2025)"
            className="min-h-[100px] resize-none pe-4 text-base"
            disabled={isResearching}
            dir="auto"
          />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Press <kbd className="border border-border bg-muted rounded-md px-1.5 py-0.5 text-xs">Ctrl+Enter</kbd> to research
          </p>
          <Button
            onClick={handleSubmit}
            disabled={!input.trim() || isResearching}
            className="gap-2"
          >
            {isResearching ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Researching...
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                Research
              </>
            )}
          </Button>
        </div>
      </div>

      {!isResearching && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Try an example:</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_QUERIES.map((q) => (
              <button
                key={q}
                onClick={() => setInput(q)}
                className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
