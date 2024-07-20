"use client";

import { Card } from "@/components/ui/card";
import { GridLayout } from "@/components/ui/gridLayout";
import { Badge } from "@/components/ui/badge";
import { Timeline, TimelineErrorFallback } from "@/components/ui/timeline";
import { Suspense } from "react";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";
import { useTeam } from "../_components/useTeam";
import { useTeamPageParams } from "../_components/useTeamPageParams";
import { TeamNameCard } from "@/components/cards/teamNameCard";
import { TeamRandomFactsCard } from "@/components/cards/teamRandomFactsCard";
import { TeamMembersCard } from "@/components/cards/teamMembersCard";

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
      <ErrorBoundary FallbackComponent={Card.ErrorFallback}>
        <Suspense fallback={<Card.SkeletonFallback />}>
          <TeamName />
        </Suspense>
      </ErrorBoundary>

      <ErrorBoundary FallbackComponent={Card.ErrorFallback}>
        <Suspense fallback={<Card.SkeletonFallback />}>
          <TeamMembers />
        </Suspense>
      </ErrorBoundary>

      <ErrorBoundary FallbackComponent={Card.ErrorFallback}>
        <Suspense fallback={<Card.SkeletonFallback />}>
          <RandomFacts />
        </Suspense>
      </ErrorBoundary>
    </GridLayout>
  );
};

const TeamName = () => {
  const searchParams = useTeamPageParams();
  const [team] = useTeam({ id: searchParams.id });

  return <TeamNameCard name={team.name} />;
};

const TeamMembers = () => {
  const searchParams = useTeamPageParams();
  const [team] = useTeam({ id: searchParams.id });

  return <TeamMembersCard usersToTeams={team.usersToTeams} />;
};

const RandomFacts = () => {
  const searchParams = useTeamPageParams();
  const [team] = useTeam({ id: searchParams.id });

  return <TeamRandomFactsCard usersToTeams={team.usersToTeams} />;
};
