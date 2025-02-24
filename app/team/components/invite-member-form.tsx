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
import { useTeam } from "~/team/hooks/use-team";
import { inviteMemberToTeamAction } from "~/team/team.actions";
import { teamInvitationSchema } from "~/team/team.schemas";
import { teamQueries } from "~/team/team.queries";
import type { z } from "zod";

export const InviteMemberForm = (props: Props) => {
  const form = useInviteMemberForm();
  const inviteMember = useInviteMember();
  const params = routeApi.useParams();

  const onSubmit = async (data: InviteMemberSchema) => {
    await inviteMember.mutateAsync(
      {
        data: {
          teamId: params.teamId,
          newMemberEmail: data.email,
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
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email:</FormLabel>
              <FormControl>
                <Input
                  placeholder="mike@example.com"
                  type="email"
                  autoFocus
                  {...field}
                />
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
            className="font-semibold"
            data-umami-event="exercise created"
          >
            <span>invite</span>
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
  const params = routeApi.useParams();
  const team = useTeam(params.teamId);

  return teamInvitationSchema
    .pick({ email: true })
    .refine(
      (data) => {
        const userAlreadyJoined = team.data.members.find((member) => {
          return member.user.email === data.email;
        });

        return !userAlreadyJoined;
      },
      {
        message: "user alrady joined team",
        path: ["email"],
      },
    )
    .refine(
      (data) => {
        const invitationAlreadySent = team.data.invitations.find(
          (invitation) => {
            return invitation.email === data.email;
          },
        );

        return !invitationAlreadySent;
      },
      {
        message: "invitation already sent",
        path: ["email"],
      },
    );
};

type InviteMemberSchema = Readonly<z.infer<ReturnType<typeof useFormSchema>>>;

const useInviteMemberForm = () => {
  const formSchema = useFormSchema();

  return useForm<InviteMemberSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });
};

const useInviteMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: inviteMemberToTeamAction,
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
          invitations: [
            {
              id: Math.random(),
              email: variables.data.newMemberEmail,
              status: "pending" as const,
            },
            ...team.invitations,
          ],
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
