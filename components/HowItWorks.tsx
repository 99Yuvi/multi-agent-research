"use client";

import { useResearchStore } from "@/store/researchStore";
import {
  BrainCircuit,
  Search,
  Globe,
  TableProperties,
  FileText,
  BarChart3,
  PenLine,
  ArrowRight,
  Hotel,
  TrendingUp,
  Stethoscope,
  ShoppingBag,
  Phone,
  IndianRupee,
  Star,
} from "lucide-react";

const PIPELINE = [
  { icon: BrainCircuit, label: "Orchestrator", desc: "Plans the research", color: "bg-purple-50 text-purple-600 border-purple-200" },
  { icon: Search,       label: "Search",       desc: "Finds top sources",  color: "bg-blue-50   text-blue-600   border-blue-200"   },
  { icon: Globe,        label: "Scraper",       desc: "Reads web pages",   color: "bg-teal-50   text-teal-600   border-teal-200"   },
  { icon: TableProperties, label: "Extractor", desc: "Pulls listings",     color: "bg-orange-50 text-orange-600 border-orange-200" },
  { icon: FileText,     label: "Summarizer",    desc: "Condenses content", color: "bg-green-50  text-green-600  border-green-200"  },
  { icon: BarChart3,    label: "Analyst",       desc: "Finds insights",    color: "bg-amber-50  text-amber-600  border-amber-200"  },
  { icon: PenLine,      label: "Writer",        desc: "Writes the report", color: "bg-rose-50   text-rose-600   border-rose-200"   },
];

const CAPABILITIES = [
  {
    icon: Hotel,
    color: "bg-blue-50 text-blue-600",
    title: "Hotel & Place Listings",
    desc: "Get structured tables with name, price, phone number, address, and rating.",
    example: "Budget hotels in Manali with contact details",
    tags: [
      { icon: IndianRupee, label: "Prices" },
      { icon: Phone,       label: "Phone" },
      { icon: Star,        label: "Ratings" },
    ],
  },
  {
    icon: TrendingUp,
    color: "bg-purple-50 text-purple-600",
    title: "Industry Trends",
    desc: "Deep research reports on any topic with analysis, key insights, and cited sources.",
    example: "Latest trends in AI agents 2025",
    tags: [],
  },
  {
    icon: Stethoscope,
    color: "bg-green-50 text-green-600",
    title: "Domain Research",
    desc: "Healthcare, finance, tech — comprehensive multi-source analysis on any field.",
    example: "How is AI transforming healthcare?",
    tags: [],
  },
  {
    icon: ShoppingBag,
    color: "bg-amber-50 text-amber-600",
    title: "Product & Market",
    desc: "Compare products, markets, or SaaS tools with structured breakdowns.",
    example: "Best practices for building SaaS products",
    tags: [],
  },
];

export function HowItWorks() {
  const { isResearching, report } = useResearchStore();

  // Hide once research starts or report exists
  if (isResearching || report) return null;

  return (
    <div className="space-y-6">
      {/* ── Agent pipeline ─────────────────────────────────────────────── */}
      <div className="rounded-lg border border-border bg-card p-5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          How it works — 7 agents in sequence
        </p>

        {/* Flow — horizontal with arrows between */}
        <div className="flex items-start gap-1 overflow-x-auto pb-1">
          {PIPELINE.map((step, i) => (
            <div key={step.label} className="flex items-start gap-1 shrink-0">
              {/* Step */}
              <div className="flex flex-col items-center w-[72px]">
                <div className={`h-10 w-10 rounded-lg border flex items-center justify-center ${step.color}`}>
                  <step.icon className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold text-foreground text-center mt-1.5 leading-tight">
                  {step.label}
                </p>
                <p className="text-[10px] text-muted-foreground text-center mt-0.5 leading-tight">
                  {step.desc}
                </p>
              </div>

              {/* Arrow between steps */}
              {i < PIPELINE.length - 1 && (
                <ArrowRight className="h-3.5 w-3.5 text-border shrink-0 mt-3" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Capability cards ────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          What you can research
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CAPABILITIES.map((cap) => (
            <div
              key={cap.title}
              className="rounded-lg border border-border bg-card p-4 space-y-2"
            >
              <div className="flex items-center gap-2.5">
                <div className={`h-8 w-8 rounded-md flex items-center justify-center ${cap.color}`}>
                  <cap.icon className="h-4 w-4" />
                </div>
                <p className="text-sm font-semibold text-foreground">{cap.title}</p>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">{cap.desc}</p>

              {/* Example query chip */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-muted-foreground">e.g.</span>
                <span className="text-xs px-2 py-0.5 rounded-full border border-border bg-secondary text-foreground">
                  {cap.example}
                </span>
              </div>

              {/* Feature tags for listings */}
              {cap.tags.length > 0 && (
                <div className="flex gap-1.5 pt-0.5">
                  {cap.tags.map((tag) => (
                    <span
                      key={tag.label}
                      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-green-200 bg-green-50 text-green-700"
                    >
                      <tag.icon className="h-3 w-3" />
                      {tag.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
