"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Users, ExternalLink, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Deal { id: string; properties: Record<string, any> }
interface Pipeline {
  id: string;
  label: string;
  stages: { id: string; label: string; displayOrder: number }[];
}

export default function CrmPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["hubspot"],
    queryFn: async () => (await fetch("/api/hubspot")).json(),
  });

  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!data?.configured) {
    return <EmptyState />;
  }

  if (data?.error) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <CardTitle>Hubspot error</CardTitle>
            </div>
            <CardDescription className="break-all">{data.error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const pipelines: Pipeline[] = data.pipelines ?? [];
  const deals: Deal[] = data.deals ?? [];

  return (
    <div className="p-6 md:p-8 space-y-6">
      <header>
        <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">
          CRM Pipeline
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {deals.length} deals across {pipelines.length} pipelines · synced from Hubspot
        </p>
      </header>

      {pipelines.map((p) => {
        const stages = [...p.stages].sort((a, b) => a.displayOrder - b.displayOrder);
        const dealsByStage = (stageId: string) =>
          deals.filter((d) => d.properties.pipeline === p.id && d.properties.dealstage === stageId);
        return (
          <section key={p.id} className="space-y-2">
            <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              {p.label}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {stages.map((s) => {
                const items = dealsByStage(s.id);
                return (
                  <div key={s.id} className="rounded-md border bg-card/40 p-3 min-h-[160px]">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium">{s.label}</span>
                      <Badge variant="muted" className="text-[10px]">{items.length}</Badge>
                    </div>
                    <ul className="space-y-2">
                      {items.map((d) => (
                        <li key={d.id} className="rounded bg-background border p-2 text-xs">
                          <div className="font-medium truncate">
                            {d.properties.dealname ?? "Untitled"}
                          </div>
                          {d.properties.amount && (
                            <div className="text-muted-foreground mt-0.5">
                              ${Number(d.properties.amount).toLocaleString()}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="p-8 grid place-items-center min-h-full">
      <div className="max-w-md text-center space-y-4">
        <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 grid place-items-center">
          <Users className="h-7 w-7 text-primary" />
        </div>
        <h2 className="font-display text-xl font-bold">Connect Hubspot</h2>
        <p className="text-sm text-muted-foreground">
          Once you paste a Hubspot Private App token in Settings, this panel becomes
          a kanban of your Founding Artists, Beta Testers, Salons, and Investors pipelines —
          clickable deal cards, drag-to-update stages, and inline notes.
        </p>
        <Link
          href="/settings"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Go to Settings <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
