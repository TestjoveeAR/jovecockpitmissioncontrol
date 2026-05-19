"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Camera,
  Link2,
  Bot as BotIcon,
  Sparkles,
  Clock,
  FileText,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatRelativeDate } from "@/lib/utils";

interface RecentNode {
  id: string;
  title: string;
  section: string;
  relPath: string;
  mtimeMs: number;
  preview: string;
}

export default function HomePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["vault", "recent"],
    queryFn: async () => {
      const res = await fetch("/api/vault?mode=recent");
      return (await res.json()) as { recent: RecentNode[]; vaultPath: string };
    },
  });

  const { data: salonsList } = useQuery({
    queryKey: ["salons"],
    queryFn: async () => {
      const res = await fetch("/api/salons");
      const j = await res.json();
      return (j.salons ?? []) as { status: string }[];
    },
  });

  const salons = salonsList ?? [];
  const inConv = salons.filter((s) => s.status === "in_conversation").length;
  const onboarded = salons.filter((s) => s.status === "onboarded").length;

  return (
    <div className="px-6 md:px-10 py-8 md:py-10 space-y-10 max-w-7xl mx-auto">
      {/* Hero */}
      <section className="fade-up">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground/80">
              <span className="h-1.5 w-1.5 rounded-full bg-primary status-dot pulse text-primary" />
              Cockpit · Live
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tightest leading-[1.02]">
              Jovée Assistant
            </h1>
            <p className="text-[15px] text-muted-foreground max-w-[58ch] leading-relaxed">
              Four product lines, {salons.length} mapped salons in Charlotte, and your vault loaded.
              Pick a panel from the left rail — or scan today below.
            </p>
          </div>
          <Link
            href="/neural-map"
            className="tactile inline-flex items-center gap-1.5 rounded-xl border border-border/70 bg-card/40 px-4 py-2.5 text-sm font-medium"
          >
            Open Neural Map
            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.75} />
          </Link>
        </div>
      </section>

      {/* KPI strip — asymmetric: 3 dense metrics + accent rail */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 fade-up fade-up-1">
        <KpiCard label="Salons mapped" value={salons.length} hint="Charlotte" />
        <KpiCard label="In conversation" value={inConv} hint="Active deals" accent />
        <KpiCard label="Onboarded" value={onboarded} hint="Partners signed" />
        <KpiCard label="Vault notes" value={data?.recent ? data.recent.length : "—"} hint="This week" />
      </section>

      {/* Product lines — clean 2x2 */}
      <section className="space-y-3">
        <SectionLabel>Product lines</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="fade-up fade-up-2">
            <ProductCard
              name="Jovée AR"
              tagline="Augmented-reality nail try-on technology — the flagship."
              status="Active build"
              statusVariant="success"
              accent="#2dd4bf"
              Icon={Camera}
              metrics={[
                { label: "AR sessions", value: "0" },
                { label: "Designs", value: "0" },
                { label: "Beta users", value: "0" },
              ]}
              href="/neural-map?section=02_Products/Jovee_AR"
            />
          </div>
          <div className="fade-up fade-up-3">
            <ProductCard
              name="Jovée Link"
              tagline="Marketplace connecting nail artists and clients."
              status="MVP"
              statusVariant="default"
              accent="#a78bfa"
              Icon={Link2}
              metrics={[
                { label: "Founding artists", value: "0" },
                { label: "Bookings", value: "0" },
                { label: "Waitlist", value: "0" },
              ]}
              href="/neural-map?section=02_Products/Jovee_Link"
            />
          </div>
          <div className="fade-up fade-up-4">
            <ProductCard
              name="Nail Robot Kiosk"
              tagline="Robotic manicure kiosk for high-traffic venues."
              status="Concept"
              statusVariant="warning"
              accent="#fb923c"
              Icon={BotIcon}
              metrics={[
                { label: "Kiosks", value: "0/5" },
                { label: "Prototypes", value: "0" },
                { label: "Partners", value: "0" },
              ]}
              href="/neural-map?section=02_Products/Nail_Robot_Kiosk"
            />
          </div>
          <div className="fade-up fade-up-5">
            <ProductCard
              name="Jovée Nail Polish"
              tagline="Premium nail-polish product line."
              status="Filed"
              statusVariant="muted"
              accent="#f472b6"
              Icon={Sparkles}
              metrics={[
                { label: "SKUs", value: "0" },
                { label: "Suppliers", value: "0" },
                { label: "Trademarks", value: "1" },
              ]}
              href="/neural-map?section=02_Products/Jovee_Nail_Polish"
            />
          </div>
        </div>
      </section>

      {/* This week */}
      <section className="space-y-3 fade-up fade-up-5">
        <SectionLabel>
          <Clock className="h-3.5 w-3.5" strokeWidth={1.75} />
          This week in the vault
        </SectionLabel>
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            ) : !data?.recent?.length ? (
              <div className="p-10 text-center text-sm text-muted-foreground">
                No vault files found. Set{" "}
                <code className="px-1.5 bg-muted rounded font-mono text-xs">VAULT_PATH</code>{" "}
                in Settings.
              </div>
            ) : (
              <ul className="divide-y divide-border/60">
                {data.recent.slice(0, 5).map((n) => (
                  <li key={n.id}>
                    <Link
                      href={`/neural-map`}
                      className="flex items-center gap-3.5 px-5 py-3.5 text-sm hover:bg-muted/30 transition-colors group"
                    >
                      <div className="h-8 w-8 rounded-lg bg-muted/60 grid place-items-center shrink-0 group-hover:bg-primary/15 group-hover:text-primary transition-colors">
                        <FileText className="h-3.5 w-3.5" strokeWidth={1.75} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{n.title}</div>
                        <div className="text-[11px] text-muted-foreground truncate font-mono">
                          {n.relPath}
                        </div>
                      </div>
                      <div className="text-[11px] text-muted-foreground whitespace-nowrap tabular-nums">
                        {formatRelativeDate(new Date(n.mtimeMs))}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/80 flex items-center gap-2">
      {children}
    </h2>
  );
}

function KpiCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: number | string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`card-lift relative overflow-hidden rounded-2xl border bg-card p-5 shadow-diffuse ${
        accent ? "border-primary/30" : "border-border/60"
      }`}
    >
      {accent && (
        <div
          aria-hidden
          className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full opacity-60"
          style={{
            background:
              "radial-gradient(closest-side, hsl(178 60% 50% / 0.18), transparent 70%)",
          }}
        />
      )}
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/80">
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <div className="font-display text-3xl font-semibold tracking-tightest tabular-nums">
          {value}
        </div>
        {accent && <TrendingUp className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} />}
      </div>
      {hint && (
        <div className="mt-1 text-[11px] text-muted-foreground/80">{hint}</div>
      )}
    </div>
  );
}
