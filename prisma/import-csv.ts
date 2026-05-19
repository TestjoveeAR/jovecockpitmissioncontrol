/**
 * One-shot import: Charlotte_Nail_Salons_Inside_485.csv → SQLite.
 *
 * - Removes the 12 placeholder seed rows (IDs 1-12) so the user-edited
 *   records (ID >= 13) are preserved.
 * - For each CSV row, skips if a salon with the same (name, address) already
 *   exists (so the script is safely re-runnable after a crash).
 * - Geocodes each address via OpenStreetMap Nominatim (1 req/sec — their TOS).
 *   Falls back to the ZIP-code centroid + tiny jitter when geocoding fails.
 * - Best-effort Vietnamese-owned detection by surname.
 */
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

// tsx doesn't auto-load .env
for (const candidate of [".env", ".env.local"]) {
  const file = path.join(process.cwd(), candidate);
  if (!fs.existsSync(file)) continue;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
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

const CSV_PATH =
  process.env.CSV_PATH ?? "D:/Downloads/Jovee/Charlotte_Nail_Salons_Inside_485.csv";

const ZIP_CENTROIDS: Record<string, [number, number]> = {
  "28202": [35.2293, -80.8432],
  "28203": [35.2057, -80.8523],
  "28204": [35.2117, -80.8278],
  "28205": [35.2273, -80.7942],
  "28207": [35.2079, -80.8264],
  "28208": [35.2335, -80.8839],
  "28209": [35.1697, -80.8623],
  "28210": [35.1543, -80.8615],
  "28211": [35.1763, -80.8084],
  "28212": [35.2002, -80.7596],
  "28213": [35.299, -80.7592],
  "28215": [35.2532, -80.7468],
  "28216": [35.2895, -80.8898],
  "28217": [35.1844, -80.9132],
  "28226": [35.1019, -80.8404],
  "28262": [35.3066, -80.7402],
  "28269": [35.3325, -80.823],
  "28270": [35.1437, -80.7488],
  "28273": [35.1318, -80.9347],
  "28277": [35.0561, -80.8425],
};

const VN_SURNAMES = new Set(
  [
    "Nguyen",
    "Tran",
    "Pham",
    "Le",
    "Vu",
    "Vo",
    "Ho",
    "Hoang",
    "Phan",
    "Dang",
    "Bui",
    "Do",
    "Ly",
    "Mai",
    "Lam",
    "Truong",
    "Dinh",
    "Trinh",
    "Cao",
    "Lam",
    "Duong",
    "Ngo",
    "Quach",
    "Tang",
    "Quong",
    "Tien",
    "Quy",
    "Quong",
    "Tin",
    "Ha",
    "Phong",
    "Hien",
    "Phoung",
    "Quang",
    "Nhiep",
    "Dung",
  ].map((s) => s.toLowerCase())
);

function isVietnameseOwner(owner: string): boolean {
  if (!owner) return false;
  // Try every "word" in the owner string against the surname set.
  // Handles formats like "Lauren Tran", "Sonny Kim & Haley Tran", "Tin L."
  const tokens = owner
    .split(/[/&,]+|\s+/)
    .map((t) => t.replace(/[^A-Za-z]/g, "").toLowerCase())
    .filter(Boolean);
  return tokens.some((t) => VN_SURNAMES.has(t));
}

function parseCSV(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        cell += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some((v) => v.trim() !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += c;
    }
  }
  if (cell || row.length) {
    row.push(cell);
    if (row.some((v) => v.trim() !== "")) rows.push(row);
  }
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => (obj[h] = (r[i] ?? "").trim()));
    return obj;
  });
}

async function geocode(
  address: string,
  zip: string
): Promise<{ lat: number; lng: number } | null> {
  const q = encodeURIComponent(`${address}, Charlotte, NC ${zip}`);
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`,
      {
        headers: {
          "User-Agent": "Jovee-Cockpit/0.1 (local-import; contact bobandmoita@gmail.com)",
          "Accept-Language": "en",
        },
      }
    );
    if (!res.ok) return null;
    const data: any = await res.json();
    if (Array.isArray(data) && data[0]?.lat && data[0]?.lon) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch {
    /* swallow */
  }
  return null;
}

function jitter(base: [number, number]): { lat: number; lng: number } {
  // ~500m of jitter to avoid perfectly overlapping markers
  return {
    lat: base[0] + (Math.random() - 0.5) * 0.012,
    lng: base[1] + (Math.random() - 0.5) * 0.012,
  };
}

async function main() {
  console.log(`[import] reading ${CSV_PATH}`);
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`[import] CSV not found at ${CSV_PATH}`);
    process.exit(1);
  }
  const text = fs.readFileSync(CSV_PATH, "utf8");
  const rows = parseCSV(text).filter((r) => r.Name && r.Address);
  console.log(`[import] parsed ${rows.length} rows`);

  // Remove the 12 placeholder seeds (they share IDs 1-12). User-added rows
  // (ID ≥ 13) are spared.
  const deleted = await prisma.salon.deleteMany({
    where: { id: { in: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] } },
  });
  console.log(`[import] removed ${deleted.count} placeholder seeds`);

  let inserted = 0;
  let skipped = 0;
  let geocoded = 0;
  let fellBack = 0;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const idx = i + 1;

    const existing = await prisma.salon.findFirst({
      where: { name: r.Name, address: r.Address },
    });
    if (existing) {
      skipped++;
      if (idx % 25 === 0) console.log(`[${idx}/${rows.length}] (skipped duplicates so far: ${skipped})`);
      continue;
    }

    let loc = await geocode(r.Address, r.Zip);
    if (loc) {
      geocoded++;
    } else {
      const centroid = ZIP_CENTROIDS[r.Zip];
      if (centroid) {
        loc = jitter(centroid);
      } else {
        // Last-resort: uptown Charlotte centroid + big jitter
        loc = jitter([35.2271, -80.8431]);
      }
      fellBack++;
    }

    const owner = r.Owner.trim() || null;
    const isVN = owner ? isVietnameseOwner(owner) : false;
    const ownerContact = r.OwnerContact?.trim() || null;
    const notes = [r.Notes?.trim(), ownerContact ? `Owner contact: ${ownerContact}` : null]
      .filter(Boolean)
      .join(" · ");

    await prisma.salon.create({
      data: {
        name: r.Name,
        address: r.Address,
        city: r.City || "Charlotte",
        state: "NC",
        zip: r.Zip || null,
        lat: loc.lat,
        lng: loc.lng,
        phone: r.Phone || null,
        ownerName: owner,
        isVietnameseOwned: isVN,
        status: "cold",
        notes: notes || null,
      },
    });
    inserted++;

    if (idx % 10 === 0 || idx === rows.length) {
      console.log(
        `[${idx}/${rows.length}] +${inserted} inserted, ${geocoded} geocoded, ${fellBack} zip-fallback, ${skipped} skipped`
      );
    }

    // Nominatim TOS: ≤1 req/sec
    if (!existing) await new Promise((r) => setTimeout(r, 1100));
  }

  const total = await prisma.salon.count();
  console.log(
    `[import] done. Inserted ${inserted}, skipped ${skipped}. Geocoded ${geocoded}, ZIP-fallback ${fellBack}. Total in DB: ${total}.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
