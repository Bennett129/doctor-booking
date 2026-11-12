import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE, verifySession } from "@/lib/session";

// Optimistic redirect only. Every admin page and Server Action also checks
// the session itself with requireAdmin().
export async function proxy(request: NextRequest) {
  const loggedIn = await verifySession(request.cookies.get(ADMIN_COOKIE)?.value);
  const onLogin = request.nextUrl.pathname === "/admin/login";

  if (!loggedIn && !onLogin) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  if (loggedIn && onLogin) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
