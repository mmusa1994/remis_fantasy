import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const isAdminRoute = req.nextUrl.pathname.startsWith("/admin/dashboard");
    const token: any = (req as any).nextauth?.token;
    if (isAdminRoute && !(token && token.isAdmin)) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      // Always allow; we handle per-route redirects above
      authorized: () => true,
    },
  }
);

export const config = {
  matcher: ["/admin/dashboard/:path*"],
};
