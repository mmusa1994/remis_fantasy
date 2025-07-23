import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    console.log("Middleware - Token:", !!req.nextauth.token);
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        console.log("Middleware authorized check:", !!token);
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ["/admin/dashboard/:path*"],
};
