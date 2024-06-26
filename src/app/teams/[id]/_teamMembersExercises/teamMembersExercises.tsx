"use client";

import { Badge } from "@/components/ui/badge";
import { Timeline, TimelineErrorFallback } from "@/components/ui/timeline";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";
import { useTeam } from "../_components/useTeam";
import { GridLayout, GridSkeleton } from "@/components/ui/gridLayout";
import { Card, CardErrorFallback } from "@/components/ui/card";
import { LineGraph } from "@/app/dashboard/_components/graphs/lineGraph";
import { RadarGraph } from "@/app/dashboard/_components/graphs/radarGraph";
import { RandomFacts } from "@/app/dashboard/_components/graphs/randomFacts";
import type { ExerciseWithData } from "@/server/db/types";
import { useTeamPageParams } from "../_components/useTeamPageParams";

export const TeamMembersExercises = () => {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          FallbackComponent={TimelineErrorFallback}
          onReset={reset}
        >
          <Content />
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
};

const Content = () => {
  const searchParams = useTeamPageParams();
  const team = useTeam({ id: searchParams.id });

  if (team.isLoading) {
    return <TimelineSkeleton />;
  }

  if (!team.data) {
    throw new Error("team not found");
  }

  return (
    <>
      {team.data.usersToTeams.map((userToTeam) => (
        <ErrorBoundary
          FallbackComponent={TimelineErrorFallback}
          key={userToTeam.memberId}
        >
          <Timeline>
            <Badge variant="accent" className="w-max">
              {userToTeam.user.name ?? userToTeam.user.email.split("@")[0]}
            </Badge>
            <GridLayout>
              {userToTeam.user.exercises.map((exercise) => (
                <ErrorBoundary
                  FallbackComponent={CardErrorFallback}
                  key={exercise.id}
                >
                  <LineGraphItem exercise={exercise} />
                </ErrorBoundary>
              ))}

              <ErrorBoundary FallbackComponent={CardErrorFallback}>
                <RadarItem exercises={userToTeam.user.exercises} />
              </ErrorBoundary>

              <ErrorBoundary FallbackComponent={CardErrorFallback}>
                <RandomFactsItem exercises={userToTeam.user.exercises} />
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

const LineGraphItem = (props: { exercise: ExerciseWithData }) => {
  return (
    <Card.Root>
      <Card.Header>
        <Card.Title>{props.exercise.name}</Card.Title>
      </Card.Header>

      <LineGraph data={props.exercise.data} />
    </Card.Root>
  );
};

const RadarItem = (props: { exercises: Array<ExerciseWithData> }) => {
  return (
    <Card.Root>
      <Card.Header>
        <Card.Title>exercises count</Card.Title>
      </Card.Header>

      <RadarGraph
        data={props.exercises.map((exercise) => ({
          exerciseName: exercise.name,
          frequency: exercise.data.length,
        }))}
      />
    </Card.Root>
  );
};

const RandomFactsItem = (props: { exercises: Array<ExerciseWithData> }) => {
  return (
    <Card.Root>
      <Card.Header>
        <Card.Title>random facts</Card.Title>
      </Card.Header>

      <RandomFacts exercises={props.exercises} />
    </Card.Root>
  );
};
