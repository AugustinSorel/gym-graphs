import { UserTeamsCard } from "./_components/userTeams";
import { HydrateClient, api } from "@/trpc/server";
import { getServerAuthSession } from "@/server/auth";
import { redirect } from "next/navigation";
import { DeleteUserAccountCard } from "./_components/deleteUserAccountCard";
import { UserAccountCard } from "./_components/userAccountTeam";
import { GithubCard } from "./_components/githubCard";
import { ThemePreferenceCard } from "./_components/themePreferenceCard";
import { WeightUnitPreferenceCard } from "./_components/weightUnitPreference";
import { AuthProvider } from "../_components/providers";

const Page = async () => {
  const session = await getServerAuthSession();

  if (!session?.user.id) {
    return redirect("/");
  }

  void api.team.all.prefetch();

  return (
    <>
      <UserAccountCard />

      <ThemePreferenceCard />

      <WeightUnitPreferenceCard />

      <AuthProvider session={session}>
        <HydrateClient>
          <UserTeamsCard />
        </HydrateClient>
      </AuthProvider>

      <GithubCard />

      <DeleteUserAccountCard />
    </>
  );
};

export default Page;
