import { NextResponse, type NextRequest } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/app/lib/session";

/* Optimistic auth gate (Next 16 "Proxy", formerly Middleware). The real
   enforcement lives in the server components / route handlers / data layer;
   this just provides fast redirects + blocks unauthenticated API calls early. */

const PUBLIC_PATHS = new Set<string>(["/", "/login"]);

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const authed = !!verifySession(req.cookies.get(SESSION_COOKIE)?.value);

  const isAuthApi = pathname.startsWith("/api/auth");
  const isPublic = PUBLIC_PATHS.has(pathname) || isAuthApi;

  if (authed && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (!authed && !isPublic) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = new URL("/login", req.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Run on everything except Next internals and static asset files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
