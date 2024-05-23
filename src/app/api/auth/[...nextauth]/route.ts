import { authOptions } from "@/server/auth";
import NextAuth from "next-auth/next";

// FIXME: waiting on nextauth to add types
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
