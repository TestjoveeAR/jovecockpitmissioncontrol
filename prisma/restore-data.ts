/**
 * Restore prisma/backup.json into the current database. Used once, after you
 * point DATABASE_URL at your fresh Neon Postgres database and run
 *
 *   npx prisma db push       # create tables
 *   npx tsx prisma/restore-data.ts
 *
 * Safe to re-run: it upserts by (name, address) for salons and (name) for
 * agents. Existing rows with the same identity are updated, not duplicated.
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
  const file = path.join(process.cwd(), "prisma", "backup.json");
  if (!fs.existsSync(file)) {
    console.error(`No backup at ${file}. Run prisma/export-data.ts first.`);
    process.exit(1);
  }
  const raw = JSON.parse(fs.readFileSync(file, "utf8"));
  const salons: any[] = raw.salons ?? [];
  const agents: any[] = raw.agents ?? [];

  let salonInserts = 0;
  let salonUpdates = 0;
  for (const s of salons) {
    const existing = await prisma.salon.findFirst({
      where: { name: s.name, address: s.address },
    });
    const data = {
      name: s.name,
      address: s.address,
      city: s.city,
      state: s.state,
      zip: s.zip ?? null,
      lat: s.lat,
      lng: s.lng,
      phone: s.phone ?? null,
      ownerName: s.ownerName ?? null,
      isVietnameseOwned: !!s.isVietnameseOwned,
      status: s.status,
      lastContacted: s.lastContacted ? new Date(s.lastContacted) : null,
      notes: s.notes ?? null,
    };
    if (existing) {
      await prisma.salon.update({ where: { id: existing.id }, data });
      salonUpdates++;
    } else {
      await prisma.salon.create({ data });
      salonInserts++;
    }
  }

  let agentInserts = 0;
  let agentUpdates = 0;
  for (const a of agents) {
    const existing = await prisma.agent.findFirst({ where: { name: a.name } });
    const data = {
      name: a.name,
      description: a.description,
      systemPrompt: a.systemPrompt ?? null,
      status: a.status,
      lastRun: a.lastRun ? new Date(a.lastRun) : null,
    };
    if (existing) {
      await prisma.agent.update({ where: { id: existing.id }, data });
      agentUpdates++;
    } else {
      await prisma.agent.create({ data });
      agentInserts++;
    }
  }

  console.log(
    `Restored: salons +${salonInserts} new, ~${salonUpdates} updated; agents +${agentInserts} new, ~${agentUpdates} updated.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
