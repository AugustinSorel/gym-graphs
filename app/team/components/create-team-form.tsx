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
import { teamSchema } from "~/team/team.schemas";
import { Switch } from "~/ui/switch";
import { createTeamAction } from "~/team/team.actions";
import { teamQueries } from "~/team/team.queries";
import { useUser } from "~/user/hooks/use-user";
import type { z } from "zod";

export const CreateTeamForm = (props: Props) => {
  const form = useCreateTeamForm();
  const createTeam = useCreateTeam();

  const onSubmit = async (data: CreateTeamSchema) => {
    await createTeam.mutateAsync(
      { data },
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
          name="isPublic"
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
                  checked={field.value}
                  onCheckedChange={field.onChange}
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

  return teamSchema.pick({ name: true, isPublic: true }).refine(
    (data) => {
      const queries = {
        userAndPublicTeams: teamQueries.userAndPublicTeams.queryKey,
      } as const;

      const cachedPublicTeams = queryClient.getQueryData(
        queries.userAndPublicTeams,
      );

      const nameTaken = cachedPublicTeams?.find((team) => {
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
      isPublic: false,
    },
  });
};

const useCreateTeam = () => {
  const queryClient = useQueryClient();
  const user = useUser();

  return useMutation({
    mutationFn: createTeamAction,
    onMutate: (variables) => {
      const keys = {
        userAndPublicTeams: teamQueries.userAndPublicTeams.queryKey,
      } as const;

      queryClient.setQueryData(keys.userAndPublicTeams, (teams) => {
        if (!teams) {
          return teams;
        }

        const teamId = Math.random();

        const optimisticTeam = {
          id: teamId,
          isPublic: variables.data.isPublic,
          name: variables.data.name,
          isUserInTeam: true,
          memberCounts: 1,
          teamToUsers: [
            {
              teamId,
              userId: user.data.id,
              role: "admin" as const,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        return [optimisticTeam, ...teams];
      });
    },
    onSettled: () => {
      const keys = {
        userAndPublicTeams: teamQueries.userAndPublicTeams,
      } as const;

      void queryClient.invalidateQueries(keys.userAndPublicTeams);
    },
  });
};
