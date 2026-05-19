import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

export const dynamic = "force-dynamic";

const ENV_FILE = path.join(process.cwd(), ".env.local");

const KNOWN_KEYS = [
  "VAULT_PATH",
  "DATABASE_URL",
  "HUBSPOT_PRIVATE_APP_TOKEN",
  "TRELLO_API_KEY",
  "TRELLO_API_TOKEN",
  "ANTHROPIC_API_KEY",
] as const;

type EnvMap = Record<string, string>;

function parseEnv(text: string): EnvMap {
  const out: EnvMap = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const k = trimmed.slice(0, eq).trim();
    let v = trimmed.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

function serializeEnv(map: EnvMap): string {
  return KNOWN_KEYS.map((k) => {
    const v = map[k] ?? "";
    // quote anything with spaces or special chars
    const needsQuotes = /[\s"'#]/.test(v);
    return `${k}=${needsQuotes ? `"${v.replace(/"/g, '\\"')}"` : v}`;
  }).join("\n") + "\n";
}

export async function GET() {
  let map: EnvMap = {};
  if (fs.existsSync(ENV_FILE)) {
    map = parseEnv(fs.readFileSync(ENV_FILE, "utf8"));
  }
  // Mask secrets when returning to the client. We only confirm "is set".
  const masked: Record<string, string> = {
    VAULT_PATH: map.VAULT_PATH ?? process.env.VAULT_PATH ?? "D:/Downloads/Jovee/Jovee Vault",
    DATABASE_URL: map.DATABASE_URL ?? process.env.DATABASE_URL ?? "file:./dev.db",
    HUBSPOT_PRIVATE_APP_TOKEN: map.HUBSPOT_PRIVATE_APP_TOKEN ? "set" : "",
    TRELLO_API_KEY: map.TRELLO_API_KEY ? "set" : "",
    TRELLO_API_TOKEN: map.TRELLO_API_TOKEN ? "set" : "",
    ANTHROPIC_API_KEY: map.ANTHROPIC_API_KEY ? "set" : "",
  };
  return NextResponse.json({ settings: masked });
}

const schema = z.object({
  VAULT_PATH: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  HUBSPOT_PRIVATE_APP_TOKEN: z.string().optional(),
  TRELLO_API_KEY: z.string().optional(),
  TRELLO_API_TOKEN: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Merge with existing — empty string means "leave alone" for secret fields,
  // but explicitly null means "clear it".
  const existing: EnvMap = fs.existsSync(ENV_FILE)
    ? parseEnv(fs.readFileSync(ENV_FILE, "utf8"))
    : {};
  const next: EnvMap = { ...existing };
  for (const [k, v] of Object.entries(parsed.data) as [keyof typeof parsed.data, string | undefined][]) {
    if (v === undefined) continue;
    if (v === "" && (k === "HUBSPOT_PRIVATE_APP_TOKEN" || k === "TRELLO_API_KEY" || k === "TRELLO_API_TOKEN" || k === "ANTHROPIC_API_KEY")) {
      // skip — empty means "no change" for secret fields
      continue;
    }
    next[k] = v;
  }
  fs.writeFileSync(ENV_FILE, serializeEnv(next), "utf8");
  // Reflect changes into the live process so Test-Connection works immediately
  for (const [k, v] of Object.entries(next)) {
    process.env[k] = v;
  }
  return NextResponse.json({ ok: true });
}
