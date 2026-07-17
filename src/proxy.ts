import { NextResponse } from "next/server";

import { auth } from "@/auth";

export default auth((request) => {
  const pathname = request.nextUrl.pathname;
  const isProtected = /^\/(en|zh)\/(dashboard|users|roles)/.test(pathname);

  if (isProtected && !request.auth) {
    const locale = pathname.split("/")[1] || "en";
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/en/:path*", "/zh/:path*"],
};
