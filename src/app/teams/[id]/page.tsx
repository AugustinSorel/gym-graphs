import { getServerAuthSession } from "@/server/auth";
import { api } from "@/trpc/server";
import { redirect } from "next/navigation";
import type { ComponentPropsWithoutRef } from "react";
import { InviteUserForm } from "./_inviteUserForm/inviteUserForm";
import {
  type TeamPageParamsSchema,
  teamPageParamsSchema,
} from "./_components/teamPageParams";
import { TeamMetadata } from "./_teamMetedata/teamMetadata";

type Props = {
  params: TeamPageParamsSchema;
};

const Page = async (unsafeProps: Props) => {
  const params = teamPageParamsSchema.safeParse(unsafeProps.params);
  const team = await api.team.get({ id: unsafeProps.params.id });

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

      <TeamMetadata />

      <p>here</p>
      <code>{JSON.stringify(team, undefined, 2)}</code>
    </>
  );
};

export default Page;

const FormContainer = (props: ComponentPropsWithoutRef<"div">) => {
  return <div {...props} className="p-10" />;
};
