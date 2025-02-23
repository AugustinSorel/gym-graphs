import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTeamMember } from "~/team/team-member.context";
import {
  Form,
  FormAlert,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/ui/form";
import { Button } from "~/ui/button";
import { Spinner } from "~/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/ui/select";
import { teamMemberSchema } from "~/team/team.schemas";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { changeTeamMemberRoleAction } from "~/team/team.actions";
import { getRouteApi } from "@tanstack/react-router";
import { teamQueries } from "~/team/team.queries";
import type { z } from "zod";

export const ChangeMemberRoleForm = (props: Props) => {
  const form = useChangeMemberPermissionForm();
  const changeMemberRole = useChangeMemberRole();
  const member = useTeamMember();
  const params = routeApi.useParams();

  const onSubmit = async (data: FormSchema) => {
    await changeMemberRole.mutateAsync(
      {
        data: {
          memberId: member.userId,
          teamId: params.teamId,
          role: data.role,
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
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a verified email to display" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {teamMemberSchema.shape.role.options.map((role) => (
                    <SelectItem value={role} key={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
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
            <span>change</span>
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

const formSchema = teamMemberSchema.pick({ role: true });

type FormSchema = Readonly<z.infer<typeof formSchema>>;

const useChangeMemberPermissionForm = () => {
  const member = useTeamMember();

  return useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: member.role,
    },
  });
};

const useChangeMemberRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: changeTeamMemberRoleAction,
    onMutate: (variables) => {
      const queries = {
        team: teamQueries.get(variables.data.teamId).queryKey,
      } as const;

      queryClient.setQueryData(queries.team, (team) => {
        if (!team) {
          return team;
        }

        return {
          ...team,
          members: team.members.map((member) => {
            if (member.userId === variables.data.memberId) {
              return {
                ...member,
                role: variables.data.role,
              };
            }

            return member;
          }),
        };
      });
    },
    onSettled: (_data, _error, variables) => {
      const queries = {
        team: teamQueries.get(variables.data.teamId),
      } as const;

      void queryClient.invalidateQueries(queries.team);
    },
  });
};
