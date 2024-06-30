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
import type { Team } from "@/server/db/types";
import { api } from "@/trpc/react";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { Edit, LogOut, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Fragment, type ComponentPropsWithoutRef, useState } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { Card } from "./card";

export const UserTeamsCard = () => {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary FallbackComponent={Card.ErrorFallback} onReset={reset}>
          <Card.Root>
            <Card.Title>teams</Card.Title>
            <Card.Description>
              Manage the Teams that you&apos;re a part of, join suggested ones,
              or create a new one.
            </Card.Description>

            <List>
              <Content />
            </List>
          </Card.Root>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
};

const Content = () => {
  const session = useSession();
  const teams = useTeams();

  if (teams.isLoading || session.status === "loading") {
    return <TeamsSkeleton />;
  }

  if (!teams.data?.length) {
    return (
      <li>
        <p className="text-center text-muted-foreground">0 teams</p>
      </li>
    );
  }

  return (
    <>
      {teams.data.map((team, i) => {
        const isAuthor = team.team.author.id === session.data?.user.id;

        return (
          <Fragment key={team.teamId}>
            <ErrorBoundary FallbackComponent={TeamItemErrorFallback}>
              <TeamItem>
                <TeamIndex>{i + 1}</TeamIndex>

                <TeamItemBody>
                  <TeamItemTitle>
                    <Button variant="link" className="h-auto p-0" asChild>
                      <Link href={`/teams/${team.teamId}`}>
                        {team.team.name}
                      </Link>
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
                {isAuthor && <RenameTeam />}
                {isAuthor && <DeleteTeam />}
              </TeamItem>
            </ErrorBoundary>

            {i < teams.data.length - 1 && <hr />}
          </Fragment>
        );
      })}
    </>
  );
};

const List = (props: ComponentPropsWithoutRef<"ul">) => {
  return (
    <ul
      className="divide-y-muted flex flex-col gap-4 rounded-sm border border-border bg-background p-4"
      {...props}
    />
  );
};

const TeamItem = (props: ComponentPropsWithoutRef<"li">) => {
  return (
    <li {...props} className={cn("flex items-center gap-2", props.className)} />
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
    <TeamItem className="border border-destructive bg-destructive/10 p-2">
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

const RenameTeam = () => {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
        >
          <Edit className="h-3.5 w-3.5" />
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
          <AlertDialogAction>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

const LeaveTeam = ({ team }: { team: Team }) => {
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const session = useSession();
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
        teams.filter((team) => team.teamId !== variables.teamId),
      );
    },
    onSettled: () => {
      void utils.team.all.invalidate();
    },
  });

  if (!session.data?.user.id) {
    throw new Error("user is not defined");
  }

  return (
    <AlertDialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-3.5 w-3.5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Do you want to leave the {team.name} team?
          </AlertDialogTitle>
          <AlertDialogDescription>
            You are about to leave the {team.name} team. If you want to re join
            this team, please ask the author of this team to send you another
            invite.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="space-x-2"
            disabled={leaveTeam.isPending}
            onClick={(e) => {
              e.preventDefault();
              leaveTeam.mutate({
                teamId: team.id,
                userId: session.data.user.id,
              });
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

const DeleteTeam = () => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive/80 hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>delete</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const TeamsSkeleton = () => {
  const items = 5;
  return (
    <>
      {[...Array<unknown>(items)].map((_, i) => (
        <Fragment key={i}>
          <TeamItem>
            <Skeleton className="h-10 w-10 rounded-full bg-primary" />

            <TeamItemBody className="flex flex-col justify-evenly gap-2 py-1">
              <Skeleton className="h-2 w-32 rounded-md bg-primary" />
              <Skeleton className="h-2 w-64 rounded-md bg-primary" />
            </TeamItemBody>
          </TeamItem>

          {i < items - 1 && <hr />}
        </Fragment>
      ))}
    </>
  );
};
