import { NextResponse } from "next/server";

// Owner-only pages under /admin. HTTP Basic Auth against the ADMIN_PASSWORD
// environment variable (set in Vercel). Any username works. With no password
// set, /admin stays locked for everyone.
export function middleware(req) {
  const pass = process.env.ADMIN_PASSWORD;
  const auth = req.headers.get("authorization") || "";
  if (pass && auth.startsWith("Basic ")) {
    try {
      const decoded = atob(auth.slice(6));
      const given = decoded.slice(decoded.indexOf(":") + 1);
      if (given === pass) {
        const res = NextResponse.next();
        res.headers.set("X-Robots-Tag", "noindex, nofollow");
        res.headers.set("Cache-Control", "private, no-store");
        return res;
      }
    } catch {}
  }
  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Auspex admin", charset="UTF-8"', "Cache-Control": "no-store" },
  });
}

export const config = { matcher: ["/admin", "/admin/:path*"] };
