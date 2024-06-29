export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/dashboard/:path*", "/exercises/:path*", "/teams/:path*"],
};
