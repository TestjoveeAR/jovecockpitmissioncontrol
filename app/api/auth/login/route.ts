import { NextResponse } from "next/server";

function expectedCookieValue(secret: string): string {
  let h = 0;
  for (let i = 0; i < secret.length; i++) {
    h = (h * 31 + secret.charCodeAt(i)) >>> 0;
  }
  return `${h.toString(36)}.${secret.length}`;
}

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const expected = process.env.COCKPIT_PASSWORD;
  if (!expected) {
    return NextResponse.json({ ok: true, gated: false });
  }
  const { password } = await req.json().catch(() => ({}));
  if (typeof password !== "string" || password !== expected) {
    return NextResponse.json({ ok: false, error: "wrong password" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set("cockpit_session", expectedCookieValue(expected), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}
