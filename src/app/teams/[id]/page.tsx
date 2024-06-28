import { getServerAuthSession } from "@/server/auth";
import { createSSRHelper } from "@/trpc/server";
import { redirect } from "next/navigation";
import type { ComponentPropsWithoutRef } from "react";
import { InviteUserForm } from "./_inviteUserForm/inviteUserForm";
import {
  type TeamPageParamsSchema,
  teamPageParamsSchema,
} from "./_components/teamPageParams";
import { TeamMetadata } from "./_teamMetedata/teamMetadata";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

type Props = {
  params: TeamPageParamsSchema;
};

const Page = async (unsafeProps: Props) => {
  const params = teamPageParamsSchema.safeParse(unsafeProps.params);

  const helpers = await createSSRHelper();
  const team = await helpers.team.get.fetch({ id: unsafeProps.params.id });

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

      <HydrationBoundary state={dehydrate(helpers.queryClient)}>
        <TeamMetadata />
      </HydrationBoundary>
    </>
  );
};

export default Page;

const FormContainer = (props: ComponentPropsWithoutRef<"div">) => {
  return <div {...props} className="p-10" />;
};
