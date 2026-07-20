import { NextResponse, type NextRequest } from "next/server";

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProtected = /^\/(en|zh)\/(dashboard|users|roles|search)/.test(pathname);
  const hasSessionCookie = isProtected && request.cookies.has(
    process.env.NODE_ENV === "production"
      ? "__Secure-atlascrm.session-token"
      : "atlascrm.session-token",
  );

  if (isProtected && !hasSessionCookie) {
    const locale = pathname.split("/")[1] || "en";
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/en/:path*", "/zh/:path*"],
};
