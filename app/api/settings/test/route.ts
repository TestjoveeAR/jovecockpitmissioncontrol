import { NextResponse } from "next/server";
import fs from "node:fs";
import { pingHubspot } from "@/lib/hubspot";
import { pingTrello } from "@/lib/trello";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { service } = await req.json();

  if (service === "vault") {
    const mode = (process.env.VAULT_SOURCE ?? "filesystem").toLowerCase();
    if (mode === "github") {
      if (!process.env.GITHUB_VAULT_REPO || !process.env.GITHUB_TOKEN) {
        return NextResponse.json({
          ok: false,
          error: "GITHUB_VAULT_REPO + GITHUB_TOKEN required when VAULT_SOURCE=github",
        });
      }
      try {
        const { getVaultSource } = await import("@/lib/vault-source");
        const files = await getVaultSource().listFiles();
        return NextResponse.json({ ok: true, count: files.length });
      } catch (e: any) {
        return NextResponse.json({ ok: false, error: e?.message ?? "GitHub fetch failed" });
      }
    }
    const p = process.env.VAULT_PATH;
    if (!p) return NextResponse.json({ ok: false, error: "VAULT_PATH not set" });
    if (!fs.existsSync(p)) return NextResponse.json({ ok: false, error: "Path does not exist" });
    return NextResponse.json({ ok: true });
  }

  if (service === "hubspot") {
    const r = await pingHubspot();
    return NextResponse.json(r);
  }

  if (service === "trello") {
    const r = await pingTrello();
    return NextResponse.json(r);
  }

  if (service === "anthropic") {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) return NextResponse.json({ ok: false, error: "ANTHROPIC_API_KEY not set" });
    try {
      const client = new Anthropic({ apiKey: key });
      // Tiniest possible request — just verify auth and produce one token.
      await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4,
        messages: [{ role: "user", content: "hi" }],
      });
      return NextResponse.json({ ok: true });
    } catch (e: any) {
      return NextResponse.json({ ok: false, error: e?.message ?? "Failed" });
    }
  }

  return NextResponse.json({ ok: false, error: "Unknown service" }, { status: 400 });
}
