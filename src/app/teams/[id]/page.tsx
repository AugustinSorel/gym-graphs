import { getServerAuthSession } from "@/server/auth";
import { redirect } from "next/navigation";
import type { ComponentPropsWithoutRef } from "react";
import { InviteUserForm } from "./_inviteUserForm/inviteUserForm";
import {
  type TeamPageParamsSchema,
  teamPageParamsSchema,
} from "./_components/teamPageParams";
import { TeamMetadata } from "./_teamMetedata/teamMetadata";
import { TeamMembersExercises } from "./_teamMembersExercises/teamMembersExercises";
import { HydrateClient, api } from "@/trpc/server";

type Props = {
  params: TeamPageParamsSchema;
};

const Page = async (unsafeProps: Props) => {
  const params = teamPageParamsSchema.safeParse(unsafeProps.params);

  const team = await api.team.get({ id: unsafeProps.params.id });

  if (!team) {
    return redirect("/dashboard");
  }

  const session = await getServerAuthSession();

  const userInTeam = team?.usersToTeams.find(
    (team) => team.memberId === session?.user.id,
  );

  if (!params.success || !userInTeam) {
    return redirect("/dashboard");
  }

  return (
    <>
      <FormContainer>
        <InviteUserForm />
      </FormContainer>

      <HydrateClient>
        <TeamMetadata />
        <TeamMembersExercises />
      </HydrateClient>
    </>
  );
};

export default Page;

const FormContainer = (props: ComponentPropsWithoutRef<"div">) => {
  return <div {...props} className="p-10" />;
};
