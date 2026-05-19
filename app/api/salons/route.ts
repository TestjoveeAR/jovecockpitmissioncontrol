import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET() {
  const salons = await prisma.salon.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ salons });
}

const createSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  city: z.string().default("Charlotte"),
  state: z.string().default("NC"),
  zip: z.string().optional().nullable(),
  lat: z.number(),
  lng: z.number(),
  phone: z.string().optional().nullable(),
  ownerName: z.string().optional().nullable(),
  isVietnameseOwned: z.boolean().optional(),
  status: z.string().default("cold"),
  notes: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const salon = await prisma.salon.create({ data: parsed.data });
  return NextResponse.json({ salon });
}
