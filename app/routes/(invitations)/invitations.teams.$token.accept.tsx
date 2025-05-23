import {
  createFileRoute,
  ErrorComponentProps,
  redirect,
} from "@tanstack/react-router";
import { ComponentProps } from "react";
import { z } from "zod";
import { DefaultErrorFallback } from "~/components/default-error-fallback";
import { permissions } from "~/libs/permissions";
import { acceptTeamInvitationAction } from "~/team/team.actions";
import { teamInvitationSchema } from "~/team/team.schemas";

export const Route = createFileRoute(
  "/(invitations)/invitations/teams/$token/accept",
)({
  params: z.object({
    token: teamInvitationSchema.shape.token,
  }),
  component: () => RouteComponent(),
  errorComponent: (props) => <ErrorComponent {...props} />,
  beforeLoad: ({ context, location }) => {
    permissions.team.acceptInvite(context.user, location.pathname);
  },
  loader: async ({ params }) => {
    const invitation = await acceptTeamInvitationAction({
      data: { token: params.token },
    });

    throw redirect({
      to: "/teams/$teamId",
      params: { teamId: invitation.teamId },
    });
  },
});

const RouteComponent = () => {
  return null;
};

const ErrorComponent = (props: ErrorComponentProps) => {
  return (
    <Main>
      <DefaultErrorFallback {...props} />
    </Main>
  );
};

const Main = (props: ComponentProps<"main">) => {
  return (
    <main
      className="max-w-app mx-auto flex flex-col gap-10 px-2 pt-10 pb-20 lg:gap-20 lg:px-4 lg:pt-20"
      {...props}
    />
  );
};
