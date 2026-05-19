import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().nullable().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  phone: z.string().nullable().optional(),
  ownerName: z.string().nullable().optional(),
  isVietnameseOwned: z.boolean().optional(),
  status: z.string().optional(),
  lastContacted: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data: any = { ...parsed.data };
  if (data.lastContacted) data.lastContacted = new Date(data.lastContacted);
  const salon = await prisma.salon.update({ where: { id }, data });
  return NextResponse.json({ salon });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  await prisma.salon.delete({ where: { id: Number(params.id) } });
  return NextResponse.json({ ok: true });
}
