"use client";

import { Badge } from "@/components/ui/badge";
import { Timeline, TimelineErrorFallback } from "@/components/ui/timeline";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";
import { useTeam } from "../_components/useTeam";
import { GridLayout, GridSkeleton } from "@/components/ui/gridLayout";
import { CardErrorFallback } from "@/components/ui/card";
import { useTeamPageParams } from "../_components/useTeamPageParams";
import { Suspense } from "react";
import { prepareUserRandomFactsData } from "@/lib/math";
import { getUserDisplayName } from "@/lib/utils";
import { ExerciseOverviewDummyCard } from "@/components/cards/exerciseOverviewCard";
import { ExercisesRadarCard } from "@/components/cards/exercisesRadarCard";
import { UserRandomFactsCard } from "@/components/cards/userRandomFactsCard";

export const TeamMembersExercises = () => {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          FallbackComponent={TimelineErrorFallback}
          onReset={reset}
        >
          <Suspense fallback={<TimelineSkeleton />}>
            <Content />
          </Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
};

const Content = () => {
  const searchParams = useTeamPageParams();
  const [team] = useTeam({ id: searchParams.id });

  return (
    <>
      {team.usersToTeams.map((userToTeam) => (
        <ErrorBoundary
          FallbackComponent={TimelineErrorFallback}
          key={userToTeam.memberId}
        >
          <Timeline>
            <Badge variant="accent" className="w-max">
              {getUserDisplayName(userToTeam.user)}
            </Badge>
            <GridLayout>
              {userToTeam.user.exercises.map((exercise) => (
                <ErrorBoundary
                  FallbackComponent={CardErrorFallback}
                  key={exercise.id}
                >
                  <ExerciseOverviewDummyCard exercise={exercise} />
                </ErrorBoundary>
              ))}

              <ErrorBoundary FallbackComponent={CardErrorFallback}>
                <ExercisesRadarCard
                  data={userToTeam.user.exercises.map((exercise) => ({
                    exerciseName: exercise.name,
                    frequency: exercise.data.length,
                  }))}
                />
              </ErrorBoundary>

              <ErrorBoundary FallbackComponent={CardErrorFallback}>
                <UserRandomFactsCard
                  data={prepareUserRandomFactsData(userToTeam.user.exercises)}
                />
              </ErrorBoundary>
            </GridLayout>
          </Timeline>
        </ErrorBoundary>
      ))}
    </>
  );
};

const TimelineSkeleton = () => {
  return (
    <Timeline>
      <Badge variant="accent" className="w-max">
        users
      </Badge>

      <GridSkeleton />
    </Timeline>
  );
};
