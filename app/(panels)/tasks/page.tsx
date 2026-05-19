"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { KanbanSquare, ExternalLink, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface TList { id: string; name: string; pos: number }
interface TCard { id: string; name: string; idList: string; desc: string; labels: { id: string; name: string; color: string }[] }

export default function TasksPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["trello"],
    queryFn: async () => (await fetch("/api/trello")).json(),
  });

  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!data?.configured) return <EmptyState />;

  if (data?.error) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <CardTitle>Trello error</CardTitle>
            </div>
            <CardDescription className="break-all">{data.error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const lists: TList[] = (data.lists ?? []).sort((a: TList, b: TList) => a.pos - b.pos);
  const cards: TCard[] = data.cards ?? [];

  return (
    <div className="p-6 md:p-8 space-y-4">
      <header>
        <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">
          Project Tasks
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {cards.length} cards on <strong>{data.board?.name}</strong> · synced from Trello
        </p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {lists.map((l) => {
          const items = cards.filter((c) => c.idList === l.id);
          return (
            <div key={l.id} className="rounded-md border bg-card/40 p-3 min-h-[200px]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium">{l.name}</span>
                <Badge variant="muted" className="text-[10px]">{items.length}</Badge>
              </div>
              <ul className="space-y-2">
                {items.map((c) => (
                  <li key={c.id} className="rounded bg-background border p-2 text-xs">
                    <div className="font-medium">{c.name}</div>
                    {c.labels?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {c.labels.map((lab) => (
                          <span
                            key={lab.id}
                            className="px-1.5 py-0.5 rounded text-[9px] font-medium"
                            style={{
                              backgroundColor: `${trelloColor(lab.color)}33`,
                              color: trelloColor(lab.color),
                            }}
                          >
                            {lab.name || lab.color}
                          </span>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function trelloColor(c: string) {
  return (
    {
      green: "#10b981",
      yellow: "#eab308",
      orange: "#f97316",
      red: "#ef4444",
      purple: "#a855f7",
      blue: "#3b82f6",
      sky: "#0ea5e9",
      lime: "#84cc16",
      pink: "#ec4899",
      black: "#52525b",
    }[c] ?? "#6b7280"
  );
}

function EmptyState() {
  return (
    <div className="p-8 grid place-items-center min-h-full">
      <div className="max-w-md text-center space-y-4">
        <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 grid place-items-center">
          <KanbanSquare className="h-7 w-7 text-primary" />
        </div>
        <h2 className="font-display text-xl font-bold">Connect Trello</h2>
        <p className="text-sm text-muted-foreground">
          Paste your Trello API key and token in Settings to load the Jovée Operations board
          as a live kanban — cards labeled by product (AR / Link / Kiosk / Marketing), drag-to-update,
          and quick-add at the top of each column.
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
