/**
 * Snapshot the current Salons + Agents tables to prisma/backup.json. Run this
 * BEFORE switching schema.prisma from SQLite to Postgres, so we don't lose
 * the imported Charlotte salons + any status/notes changes you've made.
 *
 *   npx tsx prisma/export-data.ts
 */
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

for (const c of [".env", ".env.local"]) {
  const f = path.join(process.cwd(), c);
  if (!fs.existsSync(f)) continue;
  for (const line of fs.readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!process.env[m[1]]) process.env[m[1]] = v;
  }
}

const prisma = new PrismaClient();

async function main() {
  const salons = await prisma.salon.findMany({ orderBy: { id: "asc" } });
  const agents = await prisma.agent.findMany({ orderBy: { id: "asc" } });
  const out = { exportedAt: new Date().toISOString(), salons, agents };
  const file = path.join(process.cwd(), "prisma", "backup.json");
  fs.writeFileSync(file, JSON.stringify(out, null, 2), "utf8");
  console.log(`Exported ${salons.length} salons + ${agents.length} agents → ${file}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
