"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import cytoscape, { Core, ElementDefinition } from "cytoscape";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { SECTION_COLORS, SECTION_LABELS } from "@/lib/vault-sections";

interface VaultNodeLite {
  id: string;
  title: string;
  section: string;
  relPath: string;
  mtimeMs: number;
  preview: string;
}
interface VaultEdge { source: string; target: string }
interface GraphResp { nodes: VaultNodeLite[]; edges: VaultEdge[]; vaultPath: string }

export function NeuralMap({ initialSection }: { initialSection?: string | null }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const [selected, setSelected] = useState<VaultNodeLite | null>(null);
  const [search, setSearch] = useState("");
  const [activeSections, setActiveSections] = useState<Set<string>>(
    () => new Set(Object.keys(SECTION_COLORS))
  );

  const { data, isLoading, error } = useQuery({
    queryKey: ["vault", "graph"],
    queryFn: async () => {
      const res = await fetch("/api/vault");
      return (await res.json()) as GraphResp & { error?: string };
    },
  });

  // If a section was deep-linked via ?section=, narrow the filter to just that.
  useEffect(() => {
    if (initialSection && SECTION_COLORS[initialSection]) {
      setActiveSections(new Set([initialSection]));
    }
  }, [initialSection]);

  const elements = useMemo<ElementDefinition[]>(() => {
    if (!data) return [];
    const nodeMap = new Map(data.nodes.map((n) => [n.id, n]));
    const visible = new Set(
      data.nodes.filter((n) => activeSections.has(n.section)).map((n) => n.id)
    );
    const nodeEls: ElementDefinition[] = data.nodes
      .filter((n) => visible.has(n.id))
      .map((n) => ({
        data: {
          id: n.id,
          label: n.title,
          section: n.section,
          color: SECTION_COLORS[n.section] ?? "#7a7a7a",
        },
      }));
    const edgeEls: ElementDefinition[] = data.edges
      .filter((e) => visible.has(e.source) && visible.has(e.target))
      .map((e) => ({
        data: { id: `${e.source}->${e.target}`, source: e.source, target: e.target },
      }));
    return [...nodeEls, ...edgeEls];
  }, [data, activeSections]);

  // Build cytoscape instance once data is in
  useEffect(() => {
    if (!containerRef.current || !data) return;

    if (cyRef.current) {
      cyRef.current.destroy();
      cyRef.current = null;
    }

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      wheelSensitivity: 0.2,
      style: [
        {
          selector: "node",
          style: {
            "background-color": "data(color)",
            label: "data(label)",
            "font-size": 9,
            "text-valign": "bottom",
            "text-margin-y": 4,
            color: "#cbd5e1",
            "text-outline-width": 2,
            "text-outline-color": "rgba(0,0,0,0.6)",
            width: 16,
            height: 16,
            "border-width": 0,
          },
        },
        {
          selector: "node:selected",
          style: {
            "border-width": 3,
            "border-color": "#ffffff",
            width: 22,
            height: 22,
          },
        },
        {
          selector: "node.dim",
          style: { opacity: 0.15, "text-opacity": 0.1 },
        },
        {
          selector: "node.match",
          style: {
            "border-width": 3,
            "border-color": "#fde68a",
            width: 22,
            height: 22,
          },
        },
        {
          selector: "edge",
          style: {
            width: 1,
            "line-color": "rgba(150,150,150,0.25)",
            "curve-style": "bezier",
            "target-arrow-shape": "none",
          },
        },
        {
          selector: "edge.dim",
          style: { opacity: 0.05 },
        },
      ],
      layout: {
        name: "cose",
        animate: false,
        nodeRepulsion: () => 8000,
        idealEdgeLength: () => 80,
        edgeElasticity: () => 100,
        gravity: 0.25,
        padding: 30,
      } as any,
    });

    cy.on("tap", "node", (evt) => {
      const id = evt.target.id();
      const node = data.nodes.find((n) => n.id === id);
      if (node) setSelected(node);
    });

    cyRef.current = cy;
    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, [data, elements]);

  // Apply search highlight without rebuilding the graph
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    const q = search.trim().toLowerCase();
    cy.batch(() => {
      cy.nodes().removeClass("dim match");
      cy.edges().removeClass("dim");
      if (!q) return;
      cy.nodes().forEach((n) => {
        const label = (n.data("label") as string).toLowerCase();
        if (label.includes(q)) n.addClass("match");
        else n.addClass("dim");
      });
      cy.edges().addClass("dim");
    });
  }, [search]);

  const sectionCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const n of data?.nodes ?? []) c[n.section] = (c[n.section] ?? 0) + 1;
    return c;
  }, [data]);

  return (
    <div className="flex h-full w-full">
      {/* Left rail: filter / legend */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-border/60 glass overflow-y-auto">
        <div className="border-b border-border/60 px-5 py-4">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/80 mb-3">
            Legend
          </div>
          <ul className="space-y-1.5">
            {Object.entries(SECTION_COLORS).map(([key, color]) => {
              const enabled = activeSections.has(key);
              const count = sectionCounts[key] ?? 0;
              return (
                <li key={key}>
                  <button
                    onClick={() => {
                      const next = new Set(activeSections);
                      if (enabled) next.delete(key);
                      else next.add(key);
                      setActiveSections(next);
                    }}
                    className={`group w-full flex items-center gap-2 text-left text-xs py-1 px-1.5 rounded hover:bg-muted/50 transition ${enabled ? "" : "opacity-40"}`}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="flex-1 truncate">{SECTION_LABELS[key]}</span>
                    <span className="text-muted-foreground">{count}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="px-4 py-3 text-[11px] text-muted-foreground space-y-1.5">
          <div>
            Click a colored dot to toggle that section.
            Click a node to open it.
          </div>
          <div>Total: {data?.nodes.length ?? 0} notes · {data?.edges.length ?? 0} links</div>
        </div>
      </aside>

      {/* Map area */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-2 border-b px-4 py-2.5">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Highlight nodes by name…"
              className="pl-8 h-8 text-xs"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveSections(new Set(Object.keys(SECTION_COLORS)))}
            >
              All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveSections(new Set())}
            >
              None
            </Button>
          </div>
          <div className="ml-auto text-xs text-muted-foreground hidden md:block">
            {data?.vaultPath}
          </div>
        </div>
        <div className="flex-1 relative bg-background">
          {isLoading && (
            <div className="absolute inset-0 grid place-items-center">
              <Skeleton className="h-2/3 w-2/3" />
            </div>
          )}
          {error && (
            <div className="absolute inset-0 grid place-items-center text-sm text-destructive">
              Failed to load vault.
            </div>
          )}
          {!isLoading && data?.nodes.length === 0 && (
            <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground p-8 text-center">
              <div>
                <div className="font-medium mb-2">No notes found</div>
                Set <code className="px-1 bg-muted rounded">VAULT_PATH</code> in Settings to a folder containing <code className="px-1 bg-muted rounded">.md</code> files.
              </div>
            </div>
          )}
          <div ref={containerRef} className="cy-container absolute inset-0" />
        </div>
      </div>

      <Drawer open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DrawerContent>
          {selected && (
            <NodeDetailContent
              nodeId={selected.id}
              fallback={selected}
            />
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}

function NodeDetailContent({ nodeId, fallback }: { nodeId: string; fallback: VaultNodeLite }) {
  const { data, isLoading } = useQuery({
    queryKey: ["vault", "file", nodeId],
    queryFn: async () => {
      const res = await fetch(`/api/vault/file?id=${encodeURIComponent(nodeId)}`);
      return res.json();
    },
  });
  const body = data?.node?.body ?? fallback.preview;

  return (
    <>
      <DrawerHeader>
        <div className="flex items-center gap-2 mb-1">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: SECTION_COLORS[fallback.section] }}
          />
          <Badge variant="muted" className="text-[10px]">
            {SECTION_LABELS[fallback.section]}
          </Badge>
        </div>
        <DrawerTitle>{fallback.title}</DrawerTitle>
        <DrawerDescription className="break-all">{fallback.relPath}</DrawerDescription>
      </DrawerHeader>
      <DrawerBody>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ) : (
          <div className="markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
          </div>
        )}
      </DrawerBody>
    </>
  );
}
