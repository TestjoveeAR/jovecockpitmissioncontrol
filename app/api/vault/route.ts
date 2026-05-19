import { NextResponse } from "next/server";
import { buildGraph } from "@/lib/vault-parser";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("mode") ?? "graph";

  try {
    const graph = await buildGraph();

    if (mode === "recent") {
      const recent = [...graph.nodes]
        .sort((a, b) => b.mtimeMs - a.mtimeMs)
        .slice(0, 8)
        .map(({ body, ...rest }) => rest);
      return NextResponse.json({ recent, source: graph.sourceLabel });
    }

    // Strip full body to keep the graph payload small; drawer fetches on demand.
    const lite = {
      ...graph,
      nodes: graph.nodes.map(({ body, ...rest }) => rest),
    };
    return NextResponse.json(lite);
  } catch (e: any) {
    return NextResponse.json(
      {
        error: e?.message ?? "Failed to load vault",
        nodes: [],
        edges: [],
        recent: [],
      },
      { status: 200 }
    );
  }
}
