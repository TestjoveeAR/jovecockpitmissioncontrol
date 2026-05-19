import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  systemPrompt: z.string().nullable().optional(),
  status: z.string().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const agent = await prisma.agent.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ agent });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  await prisma.agent.delete({ where: { id: Number(params.id) } });
  return NextResponse.json({ ok: true });
}
