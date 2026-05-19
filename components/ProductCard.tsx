"use client";

import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Variant = "success" | "default" | "warning" | "muted" | "destructive";

interface Props {
  name: string;
  tagline: string;
  status: string;
  statusVariant?: Variant;
  metrics: { label: string; value: string }[];
  href: string;
  accent: string;
  Icon: LucideIcon;
}

export function ProductCard({
  name,
  tagline,
  status,
  statusVariant = "default",
  metrics,
  href,
  accent,
  Icon,
}: Props) {
  return (
    <Link
      href={href}
      className="group card-lift relative block overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-diffuse"
    >
      <ArrowUpRight
        className="absolute top-5 right-5 h-4 w-4 text-muted-foreground/40 transition-all duration-300 group-hover:text-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        strokeWidth={1.75}
      />

      <div className="flex items-start gap-3.5">
        <div
          className="h-10 w-10 rounded-2xl grid place-items-center shrink-0"
          style={{
            backgroundColor: `${accent}1f`,
            boxShadow: `inset 0 0 0 1px ${accent}40`,
          }}
        >
          <Icon className="h-[18px] w-[18px]" style={{ color: accent }} strokeWidth={1.75} />
        </div>
        <div className="flex-1 min-w-0 space-y-1.5 pr-8">
          <h3 className="font-display text-[17px] font-semibold tracking-tight leading-tight">
            {name}
          </h3>
          <p className="text-[13px] text-muted-foreground leading-relaxed line-clamp-2">
            {tagline}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <Badge variant={statusVariant} className="text-[10px]">
          <span
            className={cn("status-dot", statusVariant === "success" && "pulse")}
            style={{ backgroundColor: "currentColor", color: "currentColor" }}
          />
          {status}
        </Badge>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3 border-t border-border/60 pt-5">
        {metrics.map((m) => (
          <div key={m.label} className="min-w-0">
            <div className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground/70 truncate">
              {m.label}
            </div>
            <div className="font-display text-xl font-semibold tracking-tight mt-1 tabular-nums">
              {m.value}
            </div>
          </div>
        ))}
      </div>
    </Link>
  );
}
