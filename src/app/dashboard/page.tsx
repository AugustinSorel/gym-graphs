import { SignOutButton } from "@/components/auth/authButtons";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

const DashboardPage = async () => {
  const session = await getSession();

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
