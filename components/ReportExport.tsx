"use client";

import { Download, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

interface ReportExportProps {
  report: string;
  query: string;
}

export function ReportExport({ report, query }: ReportExportProps) {
  const [copied, setCopied] = useState(false);

  const downloadMarkdown = () => {
    const filename = `research-${query.slice(0, 30).replace(/\s+/g, "-").toLowerCase()}.md`;
    const blob = new Blob([`# ${query}\n\n${report}`], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report downloaded", { description: filename });
  };

  const copyMarkdown = async () => {
    await navigator.clipboard.writeText(report);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={copyMarkdown} className="gap-1.5">
        {copied ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
        {copied ? "Copied" : "Copy"}
      </Button>
      <Button variant="outline" size="sm" onClick={downloadMarkdown} className="gap-1.5">
        <Download className="h-3.5 w-3.5" />
        Download
      </Button>
    </div>
  );
}
