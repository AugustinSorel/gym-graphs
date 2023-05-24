import { SignOutButton } from "@/components/auth/authButtons";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

const DashboardPage = async () => {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <div>
      <h1>hello</h1>
      <SignOutButton />
    </div>
  );
};

export default DashboardPage;
