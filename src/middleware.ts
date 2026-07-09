import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// حماية مبدئية: توجيه غير المصادَق بعيدًا عن المسارات المحمية.
// التحقق النهائي من الإذن يتم داخل كل مسار API عبر assertPermission.
const PROTECTED = ["/dashboard", "/admin", "/reports", "/plan"];
const PROTECTED_API = ["/api/assessments", "/api/consent", "/api/moods", "/api/admin"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const needsAuth =
    PROTECTED.some((p) => pathname.startsWith(p)) ||
    PROTECTED_API.some((p) => pathname.startsWith(p));

  if (!needsAuth) return NextResponse.next();

  // ملف تعريف جلسة Auth.js
  const hasSession =
    req.cookies.has("authjs.session-token") ||
    req.cookies.has("__Secure-authjs.session-token");

  if (!hasSession) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/auth";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/reports/:path*", "/plan/:path*", "/api/:path*"],
};
