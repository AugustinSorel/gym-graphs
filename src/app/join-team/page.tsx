import { teamInviteSchema } from "@/schemas/teamInvite.schema";
import { getServerAuthSession } from "@/server/auth";
import { api } from "@/trpc/server";
import { redirect } from "next/navigation";
import type { z } from "zod";

const joinTeamPageSearchParams = teamInviteSchema.pick({ token: true });
type JoinTeamPageSearchParams = z.infer<typeof joinTeamPageSearchParams>;

type Props = {
  searchParams: JoinTeamPageSearchParams;
};

const Page = async (unsafeProps: Props) => {
  const searchParams = joinTeamPageSearchParams.safeParse(
    unsafeProps.searchParams,
  );

  if (!searchParams.success) {
    return redirect("/");
  }

  const session = await getServerAuthSession();

  if (!session?.user) {
    return redirect(`/sign-in?cb=/join-team?token=${searchParams.data.token}`);
  }

  const invite = await api.team.getInvite({ token: searchParams.data.token });

  if (!invite) {
    return redirect("/dashboard");
  }

  if (invite.accepted) {
    return redirect(`/teams/${invite.teamId}`);
  }

  await api.team.join({ id: invite.teamId, token: invite.token });

  return redirect(`/teams/${invite.teamId}`);
};

export default Page;
