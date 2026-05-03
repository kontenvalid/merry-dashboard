export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/dashboard/:path*", "/analytics/:path*", "/social/:path*", "/ads/:path*", "/settings/:path*"],
};