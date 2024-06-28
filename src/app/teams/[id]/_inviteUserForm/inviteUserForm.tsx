"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { userSchema } from "@/schemas/user.schema";
import { api } from "@/trpc/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Send } from "lucide-react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { useTeamPageParams } from "../_components/useTeamPageParams";

export const InviteUserForm = () => {
  const pageParams = useTeamPageParams();
  const formSchema = useFormSchema();

  const invite = api.team.invite.useMutation({
    onSuccess: () => {
      form.reset();
    },

    // onMutate: () => {},

    // onSettled: () => {},
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    invite.mutate({ id: pageParams.id, email: values.email });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mx-auto grid w-full max-w-2xl grid-cols-[1fr_auto] gap-2"
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder="name@example.com" type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" aria-label="add" disabled={invite.isPending}>
                {invite.isPending ? (
                  <Loader className="h-4 w-4" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="capitalize">add</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </form>
    </Form>
  );
};

const useFormSchema = () => {
  const utils = api.useUtils();
  const pageParams = useTeamPageParams();

  const formSchema = userSchema.pick({ email: true }).refine(
    (vals) => {
      const team = utils.team.get.getData({ id: pageParams.id });

      const userAcceptedInvite = team?.usersToTeams.find((userToTeam) => {
        return (
          userToTeam.team.teamInvite.accepted &&
          userToTeam.user.email === vals.email
        );
      });

      return !userAcceptedInvite;
    },
    (vals) => ({
      message: `user ${vals.email} has already accepted the invitation`,
      path: ["email"],
    }),
  );

  return formSchema;
};
