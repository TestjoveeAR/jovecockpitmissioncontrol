import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

// tsx doesn't auto-load .env like Next does. Read it manually so the Prisma
// client picks up DATABASE_URL.
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

/**
 * Twelve placeholder Charlotte-area nail salons across a spread of zip codes
 * and statuses. Lat/lng are accurate to the zip-code centroids so the markers
 * land in the right neighborhoods even though the addresses are placeholders.
 * Replace these with real salons once outreach begins (or use "+ Add Salon").
 */
const salonSeed = [
  {
    name: "Uptown Nail Studio",
    address: "201 S Tryon St",
    zip: "28202",
    lat: 35.2271,
    lng: -80.8431,
    phone: "(704) 555-0101",
    ownerName: "Linh Nguyen",
    isVietnameseOwned: true,
    status: "onboarded",
    notes: "First Charlotte partner. Owner is enthusiastic about AR try-on.",
  },
  {
    name: "Dilworth Polish Bar",
    address: "1411 East Blvd",
    zip: "28203",
    lat: 35.2057,
    lng: -80.8523,
    phone: "(704) 555-0102",
    ownerName: "Sarah Patel",
    status: "in_conversation",
    notes: "Interested in robot kiosk demo. Follow up next week.",
  },
  {
    name: "Plaza Midwood Nails",
    address: "1300 Central Ave",
    zip: "28204",
    lat: 35.2178,
    lng: -80.8167,
    phone: "(704) 555-0103",
    ownerName: "Mai Tran",
    isVietnameseOwned: true,
    status: "in_conversation",
    notes: "Owner asked about polish-line pricing tiers.",
  },
  {
    name: "Elizabeth Nail Lounge",
    address: "1532 Elizabeth Ave",
    zip: "28204",
    lat: 35.2117,
    lng: -80.8278,
    phone: "(704) 555-0104",
    status: "contacted",
    notes: "Left voicemail 2 weeks ago.",
  },
  {
    name: "NoDa Nail Co",
    address: "3225 N Davidson St",
    zip: "28205",
    lat: 35.2466,
    lng: -80.8051,
    phone: "(704) 555-0105",
    ownerName: "Jasmine Vo",
    isVietnameseOwned: true,
    status: "in_conversation",
    notes: "Wants founding-artist program details.",
  },
  {
    name: "Myers Park Manicure",
    address: "2820 Selwyn Ave",
    zip: "28209",
    lat: 35.1881,
    lng: -80.8478,
    phone: "(704) 555-0106",
    status: "contacted",
    notes: "Reached out via Instagram DM.",
  },
  {
    name: "South Park Spa & Nails",
    address: "4400 Sharon Rd",
    zip: "28211",
    lat: 35.1517,
    lng: -80.8245,
    phone: "(704) 555-0107",
    ownerName: "Tina Pham",
    isVietnameseOwned: true,
    status: "in_conversation",
    notes: "High foot traffic — strong candidate for kiosk pilot.",
  },
  {
    name: "Eastland Nail Bar",
    address: "5601 Central Ave",
    zip: "28212",
    lat: 35.2025,
    lng: -80.7689,
    phone: "(704) 555-0108",
    status: "contacted",
    notes: "Email sent — no response yet.",
  },
  {
    name: "University Nails",
    address: "8927 JM Keynes Dr",
    zip: "28262",
    lat: 35.3066,
    lng: -80.7402,
    phone: "(704) 555-0109",
    ownerName: "Linh Phan",
    isVietnameseOwned: true,
    status: "cold",
  },
  {
    name: "Ballantyne Beauty Bar",
    address: "15105 John J Delaney Dr",
    zip: "28277",
    lat: 35.0561,
    lng: -80.8425,
    phone: "(704) 555-0110",
    status: "cold",
  },
  {
    name: "Steele Creek Nails",
    address: "13639 Steelecroft Pkwy",
    zip: "28278",
    lat: 35.116,
    lng: -80.9636,
    phone: "(704) 555-0111",
    status: "declined",
    notes: "Not interested — already partnered with a competitor.",
  },
  {
    name: "Cotswold Nail Salon",
    address: "147 S Sharon Amity Rd",
    zip: "28211",
    lat: 35.1937,
    lng: -80.7884,
    phone: "(704) 555-0112",
    ownerName: "Hong Le",
    isVietnameseOwned: true,
    status: "contacted",
    notes: "Owner asked us to follow up after Lunar New Year.",
  },
];

const agentSeed = [
  {
    name: "Product Status Agent",
    description:
      "Summarizes the state of each Jovée product (AR, Link, Kiosk, Polish) from your vault notes and surfaces stalls.",
    systemPrompt:
      "You are the Product Status Agent for Jovée. Read the latest notes in 02_Products/ and produce a 5-bullet weekly status for each product line.",
  },
  {
    name: "Patent / IP Agent",
    description:
      "Tracks filing deadlines, prior-art searches, and patent-claim drafts across the IP portfolio.",
    systemPrompt:
      "You are the Patent / IP Agent for Jovée. Monitor 04_Legal_and_Patent/ and flag deadlines, missing prior art, and weak claims.",
  },
  {
    name: "Marketing Content Agent",
    description:
      "Drafts captions, blog posts, and campaign briefs in the Jovée brand voice.",
    systemPrompt:
      "You are the Marketing Content Agent for Jovée. Match the brand voice in 01_Brand_Identity/ and produce platform-tuned content.",
  },
  {
    name: "Salon Outreach Agent",
    description:
      "Drafts personalized outreach to Charlotte salons and updates Hubspot deal stages.",
    systemPrompt:
      "You are the Salon Outreach Agent. Personalize outreach for Vietnamese-owned salons especially. Be warm, specific, and offer a clear next step.",
  },
  {
    name: "Weekly Standup Agent",
    description:
      "Writes a Monday-morning summary across products, sales pipeline, and team commitments.",
    systemPrompt:
      "You are the Weekly Standup Agent for Jovée. Produce a 1-page Monday standup: wins, blockers, this-week priorities.",
  },
];

async function main() {
  console.log("🌱 Seeding Salons…");
  for (const s of salonSeed) {
    await prisma.salon.upsert({
      where: { id: salonSeed.indexOf(s) + 1 },
      create: s,
      update: s,
    });
  }
  console.log(`  → ${salonSeed.length} salons`);

  console.log("🌱 Seeding Agents…");
  for (const a of agentSeed) {
    await prisma.agent.upsert({
      where: { id: agentSeed.indexOf(a) + 1 },
      create: a,
      update: a,
    });
  }
  console.log(`  → ${agentSeed.length} agents`);

  console.log("✅ Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
