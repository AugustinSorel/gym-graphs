import { getServerAuthSession } from "@/server/auth";
import { redirect } from "next/navigation";

const Page = async () => {
  const session = await getServerAuthSession();

  if (session?.user.id) {
    return redirect("/dashboard");
  }

  return null;
};

export default Page;
