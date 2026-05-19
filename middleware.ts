import { NextRequest, NextResponse } from "next/server";

/**
 * Shared-password gate for the deployed cockpit.
 *
 *  - Off when COCKPIT_PASSWORD is unset (i.e. local dev). The cockpit
 *    behaves as before.
 *  - On in production: any request without a valid `cockpit_session` cookie
 *    is bounced to /login, except the login route itself and Next's internal
 *    static assets.
 *
 * The cookie value is just the bcrypt-free, low-stakes hash of the password
 * stored as `COCKPIT_PASSWORD`. This is a *team* lock, not a financial one —
 * keep the password reasonable (a multi-word passphrase from a password
 * manager) and treat the cookie like a shared bearer token.
 */
function expectedCookieValue(secret: string): string {
  // Cheap, deterministic, dependency-free transform. Not cryptographic; just
  // keeps the password out of the cookie literal.
  let h = 0;
  for (let i = 0; i < secret.length; i++) {
    h = (h * 31 + secret.charCodeAt(i)) >>> 0;
  }
  return `${h.toString(36)}.${secret.length}`;
}

const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/auth/logout"];

export function middleware(req: NextRequest) {
  const password = process.env.COCKPIT_PASSWORD;
  if (!password) return NextResponse.next(); // gate disabled

  const { pathname } = req.nextUrl;
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get("cockpit_session")?.value;
  if (cookie && cookie === expectedCookieValue(password)) {
    return NextResponse.next();
  }

  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Run on everything except Next internals + static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|.*\\.png$|.*\\.svg$).*)"],
};
