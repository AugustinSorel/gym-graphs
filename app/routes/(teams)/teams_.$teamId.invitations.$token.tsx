import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { DefaultErrorFallback } from "~/components/default-error-fallback";
import { acceptTeamInvitationAction } from "~/team/team.actions";
import { teamInvitationSchema, teamSchema } from "~/team/team.schemas";

export const Route = createFileRoute(
  "/(teams)/teams_/$teamId/invitations/$token",
)({
  params: z.object({
    teamId: z.coerce.number().pipe(teamSchema.shape.id),
    token: teamInvitationSchema.shape.token,
  }),
  component: () => RouteComponent(),
  errorComponent: (props) => <DefaultErrorFallback {...props} />,
  beforeLoad: async ({ params }) => {
    await acceptTeamInvitationAction({ data: { token: params.token } });

    throw redirect({
      to: "/teams/$teamId",
      params: { teamId: params.teamId },
    });
  },
});

const RouteComponent = () => {
  return null;
};
