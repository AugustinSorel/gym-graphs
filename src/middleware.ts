//FIXME: hide home and singin page?
export { default } from "next-auth/middleware";

export const config = { matcher: ["/dashboard/:path*", "/exercises/:path*"] };
