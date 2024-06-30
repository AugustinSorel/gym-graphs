import { UserTeamsCard } from "./_components/userTeams";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { createSSRHelper } from "@/trpc/server";
import { getServerAuthSession } from "@/server/auth";
import { redirect } from "next/navigation";

const Page = async () => {
  const session = await getServerAuthSession();

  if (!session?.user.id) {
    return redirect("/");
  }

  const helpers = await createSSRHelper();
  await helpers.team.all.prefetch();

  return (
    <HydrationBoundary state={dehydrate(helpers.queryClient)}>
      <UserTeamsCard />
    </HydrationBoundary>
  );
};

export default Page;
