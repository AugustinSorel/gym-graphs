"use client";

import { Card, CardErrorFallback, CardSkeleton } from "@/components/ui/card";
import { GridLayout } from "@/components/ui/gridLayout";
import { Badge } from "@/components/ui/badge";
import { Timeline, TimelineErrorFallback } from "@/components/ui/timeline";
import { type ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { User } from "next-auth";
import { useTeam } from "../_components/useTeam";
import { useTeamPageParams } from "../_components/useTeamPageParams";

export const TeamMetadata = () => {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          FallbackComponent={TimelineErrorFallback}
          onReset={reset}
        >
          <Timeline>
            <Badge variant="accent" className="w-max">
              metadata
            </Badge>

            <Content />
          </Timeline>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
};

const Content = () => {
  return (
    <GridLayout>
      <ErrorBoundary FallbackComponent={CardErrorFallback}>
        <TeamNameCard />
      </ErrorBoundary>

      <ErrorBoundary FallbackComponent={CardErrorFallback}>
        <TeamMembers />
      </ErrorBoundary>
    </GridLayout>
  );
};

const TeamNameCard = () => {
  const searchParams = useTeamPageParams();
  const team = useTeam({ id: searchParams.id });

  if (team.isLoading) {
    return <CardSkeleton />;
  }

  if (!team.data) {
    throw new Error("team not found");
  }

  return (
    <Card.Root>
      <Card.Header>
        <Card.Title>team name</Card.Title>
      </Card.Header>
      <StrongText className="m-auto overflow-hidden capitalize">
        {team.data.name}
      </StrongText>
    </Card.Root>
  );
};

const TeamMembers = () => {
  const searchParams = useTeamPageParams();
  const team = useTeam({ id: searchParams.id });

  if (team.isLoading) {
    return <CardSkeleton />;
  }

  if (!team.data) {
    throw new Error("team not found");
  }

  const members = team.data.usersToTeams;

  return (
    <Card.Root>
      <Card.Header>
        <Card.Title>members ({members.length})</Card.Title>
      </Card.Header>

      <MemberList>
        {members.map((member) => (
          <MemberItem key={member.user.id} member={member.user} />
        ))}
      </MemberList>
    </Card.Root>
  );
};

const MemberItem = ({ member }: { member: User }) => {
  const name = member.name ?? member.email?.split("@")?.at(0) ?? "anonymous";

  return (
    <li className="grid grid-cols-[auto_1fr] grid-rows-[auto_auto] items-center gap-x-3 text-left">
      <Avatar className="row-span-2">
        <AvatarImage src={member.image ?? ""} alt={`${member.email} avatar'`} />
        <AvatarFallback>{name?.at(0)}</AvatarFallback>
      </Avatar>

      <p className="truncate capitalize">{name}</p>

      <p className="truncate text-sm text-muted-foreground">{member.email}</p>
    </li>
  );
};

const StrongText = (props: ComponentPropsWithoutRef<"strong">) => {
  return (
    <strong
      {...props}
      className={cn("text-4xl font-bold text-brand-color-two", props.className)}
    />
  );
};

const MemberList = (props: ComponentPropsWithoutRef<"ul">) => {
  return (
    <ul
      className=" divide-y-muted-foreground max-h-full space-y-3 divide-y overflow-auto p-5 [&>*:not(:first-child)]:pt-3"
      {...props}
    />
  );
};
