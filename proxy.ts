import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Simple in-memory rate limit (Note: This is reset on every serverless function cold start)
// For production, use Upstash Redis or similar.
const rateLimitMap = new Map();

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Rate Limiting for API routes
  if (pathname.startsWith("/api/login") || pathname.startsWith("/api/users")) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    const now = Date.now();
    const limit = 10; // 10 requests
    const window = 60 * 1000; // per minute

    const userRequests = rateLimitMap.get(ip) || [];
    const recentRequests = userRequests.filter((time: number) => now - time < window);
    
    if (recentRequests.length >= limit) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }
    
    recentRequests.push(now);
    rateLimitMap.set(ip, recentRequests);
  }

  // 2. Auth Protection
  const token = await getToken({ req: request });
  const isAuthPage = pathname.startsWith("/login");
  const isDashboardPage = pathname.startsWith("/dashboard");
  const isApiPage = pathname.startsWith("/api") && !pathname.startsWith("/api/auth");

  if (isDashboardPage || isApiPage) {
    if (!token) {
      const url = new URL("/login", request.url);
      url.searchParams.set("callbackUrl", encodeURI(pathname));
      return NextResponse.redirect(url);
    }
  }

  if (isAuthPage) {
    if (token) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/api/:path*"],
};
