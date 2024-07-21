import { UserTeamsCard } from "./_components/userTeams";
import { HydrateClient, api } from "@/trpc/server";
import { getServerAuthSession } from "@/server/auth";
import { redirect } from "next/navigation";
import { DeleteUserAccountCard } from "./_components/deleteUserAccountCard";
import { UserAccountCard } from "./_components/userAccountTeam";
import { GithubCard } from "./_components/githubCard";
import { ThemePreferenceCard } from "./_components/themePreferenceCard";
import { WeightUnitPreferenceCard } from "./_components/weightUnitPreference";
import { UsernameCard } from "./_components/usernameCard";

const Page = async () => {
  const session = await getServerAuthSession();

  if (!session?.user.id) {
    return redirect("/");
  }

  void api.team.all.prefetch();
  void api.user.get.prefetch();

  return (
    <>
      <HydrateClient>
        <UserAccountCard />
      </HydrateClient>

      <HydrateClient>
        <UsernameCard />
      </HydrateClient>

      <ThemePreferenceCard />

      <WeightUnitPreferenceCard />

      <HydrateClient>
        <UserTeamsCard />
      </HydrateClient>

      <GithubCard />

      <DeleteUserAccountCard />
    </>
  );
};

export default Page;
