import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { permissions } from "~/libs/permissions";
import { teamQueries } from "~/team/team.queries";
import { teamSchema } from "~/team/team.schemas";
import { Button } from "~/ui/button";

export const Route = createFileRoute("/(teams)/teams_/$teamId")({
  params: z.object({
    teamId: z.coerce.number().pipe(teamSchema.shape.id),
  }),
  component: () => RouteComponent(),
  beforeLoad: async ({ context }) => {
    permissions.team.view(context.user);
  },
  loader: async ({ params, context }) => {
    const queries = {
      team: teamQueries.get(params.teamId),
    } as const;

    await context.queryClient.ensureQueryData(queries.team);
  },
});

const RouteComponent = () => {
  const params = Route.useParams();

  return (
    <>
      <div>Hello "/(teams)/teams/$teamId"!</div>
      <Button asChild variant="outline">
        <Link to="/teams/$teamId/settings" params={{ teamId: params.teamId }}>
          settings
        </Link>
      </Button>
      <Button asChild>
        <Link to="..">back</Link>
      </Button>
    </>
  );
};
