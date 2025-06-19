import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/ui/alert-dialog";
import { Button } from "~/ui/button";
import { Spinner } from "~/ui/spinner";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { useTransition } from "react";
import { useTeam } from "~/team/hooks/use-team";
import { deleteTeamAction } from "~/team/team.actions";
import { teamQueries } from "~/team/team.queries";

export const DeleteTeamDialog = () => {
  const [isRedirectPending, startRedirectTransition] = useTransition();
  const navigate = useNavigate();
  const params = routeApi.useParams();
  const team = useTeam(params.teamId);
  const deleteTeam = useDeleteTeam();

  const deleteTeamHandler = () => {
    deleteTeam.mutate(
      { data: { teamId: team.data.id } },
      {
        onSuccess: () => {
          startRedirectTransition(async () => {
            await navigate({ to: "/teams" });
          });
        },
      },
    );
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your
            account and remove your data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={deleteTeam.isPending || isRedirectPending}
            onClick={(e) => {
              e.preventDefault();
              deleteTeamHandler();
            }}
          >
            <span>Delete</span>
            {(deleteTeam.isPending || isRedirectPending) && <Spinner />}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

const routeApi = getRouteApi("/(teams)/teams_/$teamId_/settings");

const useDeleteTeam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTeamAction,
    onMutate: (variables) => {
      const queries = {
        team: teamQueries.get(variables.data.teamId),
        userAndPublicTeams: teamQueries.userAndPublicTeams().queryKey,
      } as const;

      queryClient.removeQueries(queries.team);

      queryClient.setQueryData(queries.userAndPublicTeams, (teams) => {
        if (!teams) {
          return teams;
        }

        return {
          ...teams,
          pages: teams.pages.map((page) => {
            return {
              ...page,
              teams: page.teams.filter((team) => {
                return team.id !== variables.data.teamId;
              }),
            };
          }),
        };
      });
    },
    onSettled: (_data, _error, variables) => {
      const queries = {
        team: teamQueries.get(variables.data.teamId),
        userAndPublicTeams: teamQueries.userAndPublicTeams(),
      } as const;

      void queryClient.invalidateQueries(queries.team);
      void queryClient.invalidateQueries(queries.userAndPublicTeams);
    },
  });
};
