import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET() {
  const agents = await prisma.agent.findMany({ orderBy: { id: "asc" } });
  return NextResponse.json({ agents });
}

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  systemPrompt: z.string().optional().nullable(),
  status: z.string().default("not_deployed"),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const agent = await prisma.agent.create({ data: parsed.data });
  return NextResponse.json({ agent });
}
