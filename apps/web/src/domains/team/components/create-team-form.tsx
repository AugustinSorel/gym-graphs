import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import {
  Form,
  FormAlert,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/ui/form";
import { Spinner } from "~/ui/spinner";
import { Input } from "~/ui/input";
import { Button } from "~/ui/button";
import { teamSchema } from "@gym-graphs/schemas/team";
import { Switch } from "~/ui/switch";
import { teamQueries } from "~/domains/team/team.queries";
import { useUser } from "~/domains/user/hooks/use-user";
import { api, parseJsonResponse } from "~/libs/api";
import type { z } from "zod";
import type { InferRequestType } from "hono";

export const CreateTeamForm = (props: Props) => {
  const form = useCreateTeamForm();
  const createTeam = useCreateTeam();

  const onSubmit = async (data: CreateTeamSchema) => {
    await createTeam.mutateAsync(
      { json: data },
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
                <Input placeholder="team - 1" autoFocus {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="visibility"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between">
              <div className="space-y-0.5">
                <FormLabel>Public:</FormLabel>
                <FormDescription>
                  Make your team visible to the whole world
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value === "public"}
                  onCheckedChange={(isPublic) => {
                    field.onChange(isPublic ? "public" : "private");
                  }}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormAlert />

        <footer className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="font-semibold"
            data-umami-event="exercise created"
          >
            <span>create</span>
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

const useFormSchema = () => {
  const queryClient = useQueryClient();

  return teamSchema.pick({ name: true, visibility: true }).refine(
    (data) => {
      const queries = {
        all: teamQueries.all().queryKey,
      } as const;

      const cachedPublicTeams = queryClient.getQueryData(queries.all);

      const nameTaken = cachedPublicTeams?.pages
        .flatMap((page) => page.teams)
        .find((team) => {
          return team.name === data.name;
        });

      return !nameTaken;
    },
    {
      message: "team already created",
      path: ["name"],
    },
  );
};

type CreateTeamSchema = Readonly<z.infer<ReturnType<typeof useFormSchema>>>;

const useCreateTeamForm = () => {
  const formSchema = useFormSchema();

  return useForm<CreateTeamSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      visibility: "private",
    },
  });
};

const useCreateTeam = () => {
  const user = useUser();
  const req = api().teams.$post;

  const queries = {
    teams: teamQueries.all(),
  } as const;

  return useMutation({
    mutationFn: async (input: InferRequestType<typeof req>) => {
      return parseJsonResponse(req(input));
    },
    onMutate: (variables, ctx) => {
      ctx.client.setQueryData(queries.teams.queryKey, (teams) => {
        if (!teams) {
          return teams;
        }

        const teamId = Math.random();

        const optimisticTeam = {
          id: teamId,
          visibility: variables.json.visibility,
          name: variables.json.name,
          isUserInTeam: true,
          memberCounts: 1,
          eventNotificationCount: 0,
          teamToUsers: [
            {
              teamId,
              userId: user.data.id,
              role: "admin" as const,
              createdAt: new Date().toString(),
              updatedAt: new Date().toString(),
            },
          ],
          createdAt: new Date().toString(),
          updatedAt: new Date().toString(),
        };

        return {
          ...teams,
          pages: teams.pages.map((page, i) => {
            if (i === 0) {
              return {
                ...page,
                teams: [optimisticTeam, ...page.teams],
              };
            }

            return page;
          }),
        };
      });
    },
    onSettled: (_data, _err, _variables, _res, ctx) => {
      void ctx.client.invalidateQueries(queries.teams);
    },
  });
};
