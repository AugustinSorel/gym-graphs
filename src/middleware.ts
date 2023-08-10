import { env } from "./env.mjs";
import { withAuth } from "next-auth/middleware";

//TODO: hide home and singin page?

export default withAuth({
  secret: env.NEXTAUTH_SECRET,

  callbacks: {
    authorized: ({ req, token }) => {
      if (token) {
        return true;
      }
      return false;
    },
  },
});

export const config = { matcher: ["/dashboard/:path*", "/exercises/:path*"] };
