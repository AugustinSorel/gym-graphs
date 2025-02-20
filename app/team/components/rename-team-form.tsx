import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import {
  Form,
  FormAlert,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/ui/form";
import { Spinner } from "~/ui/spinner";
import { Input } from "~/ui/input";
import { Button } from "~/ui/button";
import { getRouteApi } from "@tanstack/react-router";
import { tileSchema } from "~/dashboard/dashboard.schemas";
import { useTeam } from "~/team/hooks/use-team";
import { teamQueries } from "~/team/team.queries";
import { renameTeamAction } from "~/team/team.actions";
import type { z } from "zod";

export const RenameTeamForm = (props: Props) => {
  const form = useRenameTeamForm();
  const renameTeam = useRenameTeam();
  const params = routeApi.useParams();
  const team = useTeam(params.teamId);

  const onSubmit = async (data: CreateExerciseSchema) => {
    await renameTeam.mutateAsync(
      {
        data: {
          teamId: team.data.id,
          name: data.name,
        },
      },
      {
        onSuccess: () => {
          if (props.onSuccess) {
            props.onSuccess();
          }
        },
        onError: (error) => {
          form.setError("root", { message: error.message });
        },
      },
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name:</FormLabel>
              <FormControl>
                <Input placeholder="Bench press..." autoFocus {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormAlert />

        <footer className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            data-umami-event="rename exercise"
            className="font-semibold"
          >
            <span>rename</span>
            {form.formState.isSubmitting && <Spinner />}
          </Button>
        </footer>
      </form>
    </Form>
  );
};

type Props = Readonly<{
  onSuccess?: () => void;
}>;

const routeApi = getRouteApi("/(teams)/teams_/$teamId_/settings");

const useFormSchema = () => {
  const queryClient = useQueryClient();
  const params = routeApi.useParams();

  return tileSchema.pick({ name: true }).refine(
    (data) => {
      const queries = {
        teams: teamQueries.userAndPublicTeams.queryKey,
      } as const;

      const cachedTeams = queryClient.getQueryData(queries.teams);

      const nameTaken = cachedTeams?.find((team) => {
        return team.name === data.name && team.id !== params.teamId;
      });

      return !nameTaken;
    },
    {
      message: "team already created",
      path: ["name"],
    },
  );
};

type CreateExerciseSchema = Readonly<z.infer<ReturnType<typeof useFormSchema>>>;

const useRenameTeamForm = () => {
  const formSchema = useFormSchema();
  const params = routeApi.useParams();
  const team = useTeam(params.teamId);

  return useForm<CreateExerciseSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: team.data.name,
    },
  });
};

const useRenameTeam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: renameTeamAction,
    onMutate: (variables) => {
      const queries = {
        team: teamQueries.get(variables.data.teamId).queryKey,
        userAndPublicTeams: teamQueries.userAndPublicTeams.queryKey,
      } as const;

      queryClient.setQueryData(queries.userAndPublicTeams, (teams) => {
        if (!teams) {
          return teams;
        }

        return teams.map((team) => {
          if (team.id === variables.data.teamId) {
            return {
              ...team,
              name: variables.data.name,
            };
          }

          return team;
        });
      });

      queryClient.setQueryData(queries.team, (team) => {
        if (!team) {
          return team;
        }

        return {
          ...team,
          name: variables.data.name,
        };
      });
    },
    onSettled: (_data, _error, variables) => {
      const queries = {
        team: teamQueries.get(variables.data.teamId),
        userAndPublicTeams: teamQueries.userAndPublicTeams,
      } as const;

      void queryClient.invalidateQueries(queries.team);
      void queryClient.invalidateQueries(queries.userAndPublicTeams);
    },
  });
};
