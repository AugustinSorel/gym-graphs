import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

const Page = async () => {
  const session = await getServerSession(authOptions);

  if (session && session.user.id) {
    return redirect("/dashboard");
  }

  return null;
};

export default Page;
