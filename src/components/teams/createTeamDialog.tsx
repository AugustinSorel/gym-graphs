"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { teamSchema } from "@/schemas/team.schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { useRouter } from "next/navigation";
import { type PropsWithChildren, useState } from "react";
import { type RouterOutputs, api } from "@/trpc/react";
import { Button } from "../ui/button";
import { Loader } from "../ui/loader";

export const CreateTeamDialog = (props: PropsWithChildren) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const formSchema = useFormSchema();
  const utils = api.useUtils();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "" },
  });

  const createTeam = api.team.create.useMutation({
    onSuccess: (team) => {
      setIsDialogOpen(false);
      router.push(`/teams/${team.id}`);
    },
    onMutate: async (variables) => {
      await utils.team.all.cancel();

      const optimisticTeam: RouterOutputs["team"]["all"][number] = {
        memberId: Math.random().toString(),
        teamId: Math.random().toString(),
        team: {
          id: Math.random().toString(),
          authorId: Math.random().toString(),
          name: variables.name,
          createdAt: new Date(),
          updatedAt: new Date(),
          author: {
            email: "",
            id: Math.random().toString(),
            emailVerified: null,
            image: null,
            name: null,
          },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      utils.team.all.setData(undefined, (teams) => [
        optimisticTeam,
        ...(teams ?? []),
      ]);
    },
    onSettled: () => {
      void utils.team.all.invalidate();
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createTeam.mutate(values);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>{props.children}</DialogTrigger>

      <DialogContent className="space-y-5 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="first-letter:capitalize">
            create a team
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>team name:</FormLabel>
                  <FormControl>
                    <Input placeholder="friends" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={createTeam.isPending}
              className="ml-auto"
            >
              {createTeam.isPending && <Loader className="mr-2" />}
              <span className="capitalize">save</span>
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

const useFormSchema = () => {
  const utils = api.useUtils();

  return teamSchema.pick({ name: true }).refine(
    (data) => {
      const teams = utils.team.all.getData();

      return !teams?.find(
        (team) => team.team.name.toLowerCase() === data.name.toLowerCase(),
      );
    },
    (data) => {
      return {
        message: `${data.name} is already used`,
        path: ["name"],
      };
    },
  );
};
