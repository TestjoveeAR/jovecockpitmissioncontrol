import { NextResponse } from "next/server";
import { buildGraph } from "@/lib/vault-parser";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  try {
    const graph = await buildGraph();
    const node = graph.nodes.find((n) => n.id === id);
    if (!node) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ node });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "load failed" }, { status: 500 });
  }
}
