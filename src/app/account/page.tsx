import { UserTeamsCard } from "./_components/userTeams";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { createSSRHelper } from "@/trpc/server";
import { getServerAuthSession } from "@/server/auth";
import { redirect } from "next/navigation";
import { DeleteUserAccountCard } from "./_components/deleteUserAccountCard";
import { UserAccountCard } from "./_components/userAccountTeam";

const Page = async () => {
  const session = await getServerAuthSession();

  if (!session?.user.id) {
    return redirect("/");
  }

  const helpers = await createSSRHelper();
  await helpers.team.all.prefetch();

  return (
    <>
      <UserAccountCard />

      <HydrationBoundary state={dehydrate(helpers.queryClient)}>
        <UserTeamsCard />
      </HydrationBoundary>

      <DeleteUserAccountCard />
    </>
  );
};

export default Page;
