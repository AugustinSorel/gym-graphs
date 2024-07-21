"use client";

import { useTeams } from "@/app/teams/_components/useTeams";
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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { api, type RouterOutputs } from "@/trpc/react";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { Edit, LogOut, Trash2 } from "lucide-react";
import Link from "next/link";
import { type ComponentPropsWithoutRef, useState, Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { Card } from "./card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { teamSchema } from "@/schemas/team.schemas";
import type { z } from "zod";
import { CreateTeamDialog } from "@/components/teams/createTeamDialog";
import { useUser } from "./useUser";

export const UserTeamsCard = () => {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary FallbackComponent={Card.ErrorFallback} onReset={reset}>
          <Card.Root>
            <Card.Body>
              <Card.Title>teams</Card.Title>
              <Card.Description>
                Manage the Teams that you&apos;re a part of, join suggested
                ones, or create a new one.
              </Card.Description>

              <List>
                <Suspense fallback={<TeamsSkeleton />}>
                  <Content />
                </Suspense>
              </List>
            </Card.Body>
            <Card.Footer>
              <CreateTeamDialog>
                <Button>new team</Button>
              </CreateTeamDialog>
            </Card.Footer>
          </Card.Root>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
};

const Content = () => {
  const [teams] = useTeams();
  const [user] = useUser();

  if (!teams.length) {
    return (
      <li>
        <p className="text-center text-muted-foreground">0 teams</p>
      </li>
    );
  }

  return (
    <>
      {teams.map((team, i) => {
        const isAuthor = team.team.author.id === user.id;

        return (
          <ErrorBoundary
            FallbackComponent={TeamItemErrorFallback}
            key={team.teamId}
          >
            <TeamItem>
              <TeamIndex>{i + 1}</TeamIndex>

              <TeamItemBody>
                <TeamItemTitle>
                  <Button variant="link" className="h-auto p-0" asChild>
                    <Link href={`/teams/${team.teamId}`}>{team.team.name}</Link>
                  </Button>
                </TeamItemTitle>
                <TeamItemSubTitle>
                  created by{" "}
                  {isAuthor
                    ? "you"
                    : team.team.author.name ??
                      team.team.author.email.split("@").at(0)}
                </TeamItemSubTitle>
              </TeamItemBody>

              {!isAuthor && <LeaveTeam team={team.team} />}
              {isAuthor && <RenameTeam team={team.team} />}
              {isAuthor && <DeleteTeam team={team.team} />}
            </TeamItem>
          </ErrorBoundary>
        );
      })}
    </>
  );
};

const List = (props: ComponentPropsWithoutRef<"ul">) => {
  return (
    <ul
      className="divide-y-muted flex flex-col gap-4 divide-y rounded-sm border border-border bg-background p-3 [&>*:not(:first-child)]:pt-4"
      {...props}
    />
  );
};

const TeamItem = (props: ComponentPropsWithoutRef<"li">) => {
  return (
    <li
      {...props}
      className={cn("flex items-center gap-2 p-1", props.className)}
    />
  );
};

const TeamIndex = (props: ComponentPropsWithoutRef<"span">) => {
  return (
    <span
      className="row-span-2 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-primary font-bold"
      {...props}
    />
  );
};

const TeamItemTitle = (props: ComponentPropsWithoutRef<"h2">) => {
  return (
    <h2 className="truncate text-sm font-semibold capitalize" {...props} />
  );
};

const TeamItemSubTitle = (props: ComponentPropsWithoutRef<"h3">) => {
  return <h2 {...props} className="truncate text-sm text-muted-foreground" />;
};

const TeamItemBody = (props: ComponentPropsWithoutRef<"div">) => {
  return <div {...props} className={cn("flex-1 truncate", props.className)} />;
};

const TeamItemErrorFallback = (props: FallbackProps) => {
  const errorMessage =
    props.error instanceof Error
      ? props.error.message
      : JSON.stringify(props.error);

  return (
    <TeamItem className="border-destructive bg-destructive/10 p-2 first:border-t">
      <TeamIndex />
      <TeamItemBody>
        <TeamItemTitle>something went wrong</TeamItemTitle>

        <code className="flex max-h-full overflow-auto">
          Error: {errorMessage}
        </code>
      </TeamItemBody>

      <Button onClick={props.resetErrorBoundary} variant="destructive">
        try again
      </Button>
    </TeamItem>
  );
};

const RenameTeam = ({
  team,
}: {
  team: RouterOutputs["team"]["all"][number]["team"];
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const formSchema = useRenameTeamSchema();
  const utils = api.useUtils();

  const renameTeam = api.team.rename.useMutation({
    onSuccess: () => {
      setIsDialogOpen(false);
    },
    onMutate: async (variables) => {
      await utils.team.all.cancel();
      await utils.team.get.cancel({ id: variables.id });

      utils.team.all.setData(undefined, (teams) =>
        teams?.map((team) =>
          team.teamId === variables.id
            ? { ...team, team: { ...team.team, name: variables.name } }
            : team,
        ),
      );

      utils.team.get.setData({ id: variables.id }, (team) =>
        !team ? undefined : { ...team, name: variables.name },
      );
    },
    onSettled: (_data, _error, variables) => {
      void utils.team.all.invalidate();
      void utils.team.get.invalidate({ id: variables.id });
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: team.name },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    renameTeam.mutate({
      id: team.id,
      name: values.name,
    });
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p className="capitalize">rename</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DialogContent className="space-y-5 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="capitalize">change team name</DialogTitle>
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
                  <FormLabel>exercise name</FormLabel>
                  <FormControl>
                    <Input placeholder="team name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={renameTeam.isPending}
              className="ml-auto"
            >
              {renameTeam.isPending && <Loader className="mr-2" />}
              <span className="capitalize">save</span>
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

const useRenameTeamSchema = () => {
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

const LeaveTeam = ({
  team,
}: {
  team: RouterOutputs["team"]["all"][number]["team"];
}) => {
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const utils = api.useUtils();

  const leaveTeam = api.team.leave.useMutation({
    onSuccess: () => {
      setIsAlertDialogOpen(false);
    },
    onMutate: async (variables) => {
      await utils.team.all.cancel();

      const teams = utils.team.all.getData();

      if (!teams) {
        return;
      }

      utils.team.all.setData(
        undefined,
        teams.filter((team) => team.teamId !== variables.id),
      );
    },
    onSettled: () => {
      void utils.team.all.invalidate();
    },
  });

  return (
    <AlertDialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p className="capitalize">leave</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Do you want to leave the {team.name}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            You are about to leave the {team.name}. If you want to re join this
            team, please ask the author of this team to send you another invite.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="space-x-2"
            disabled={leaveTeam.isPending}
            onClick={(e) => {
              e.preventDefault();
              leaveTeam.mutate({ id: team.id });
            }}
          >
            {leaveTeam.isPending && <Loader />}
            <span>Leave</span>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

const DeleteTeam = ({
  team,
}: {
  team: RouterOutputs["team"]["all"][number]["team"];
}) => {
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const utils = api.useUtils();

  const deleteTeam = api.team.delete.useMutation({
    onSuccess: () => {
      setIsAlertDialogOpen(false);
    },
    onMutate: async (variables) => {
      await utils.team.all.cancel();
      await utils.team.get.cancel({ id: variables.id });

      utils.team.all.setData(undefined, (teams) =>
        teams?.filter((team) => team.teamId !== variables.id),
      );

      utils.team.get.setData({ id: variables.id }, undefined);
    },
    onSettled: (_data, _error, variables) => {
      void utils.team.all.invalidate();
      void utils.team.get.invalidate({ id: variables.id });
    },
  });

  return (
    <AlertDialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive/80 hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p className="capitalize">delete</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Do you really want to delete the {team.name}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete{" "}
            {team.name} from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="space-x-2 bg-destructive text-destructive-foreground hover:bg-destructive/80"
            disabled={deleteTeam.isPending}
            onClick={(e) => {
              e.preventDefault();
              deleteTeam.mutate({
                id: team.id,
              });
            }}
          >
            {deleteTeam.isPending && <Loader />}
            <span>Delete</span>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

const TeamsSkeleton = () => {
  const items = 5;

  return (
    <>
      {[...Array<unknown>(items)].map((_, i) => (
        <TeamItem key={i}>
          <Skeleton className="h-10 w-10 rounded-full bg-primary" />

          <TeamItemBody className="flex flex-col justify-evenly gap-2 py-1">
            <Skeleton className="h-2 w-32 rounded-md bg-primary" />
            <Skeleton className="h-2 w-64 rounded-md bg-primary" />
          </TeamItemBody>
        </TeamItem>
      ))}
    </>
  );
};
