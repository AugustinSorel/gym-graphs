"use client";

import { Badge } from "@/components/ui/badge";
import { dateAsYearMonthDayFormat } from "@/lib/date";
import type { RouterOutputs } from "@/trpc/react";
import { useExercises } from "../_components/useExercises";
import { GridLayout, GridSkeleton } from "@/components/ui/gridLayout";
import { Card, CardErrorFallback } from "@/components/ui/card";
import { LineGraph } from "@/components/graphs/lineGraph";
import { RadarGraph } from "@/components/graphs/radarGraph";
import { HeatmapGraph } from "@/components/graphs/heatmapGraph";
import { prepareHeatmapData } from "@/components/graphs/heatmapUtils";
import { RandomFacts } from "@/components/graphs/randomFacts";
import { Timeline, TimelineErrorFallback } from "@/components/ui/timeline";
import { ErrorBoundary } from "react-error-boundary";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { Suspense } from "react";

export const MonthlyExercisesTimelines = () => {
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
  const exercises = useExercises();

  return (
    <>
      {getExercisesByMonth(exercises).map((group) => (
        <ErrorBoundary
          FallbackComponent={TimelineErrorFallback}
          key={group.date}
        >
          <Timeline>
            <Badge variant="accent" className="w-max">
              <time dateTime={group.date}>
                {new Date(group.date).toLocaleDateString(undefined, {
                  month: "long",
                  year: "numeric",
                })}
              </time>
            </Badge>
            <GridLayout>
              {group.exercises.map((exercise) => (
                <ErrorBoundary
                  FallbackComponent={CardErrorFallback}
                  key={exercise.id}
                >
                  <Card.Root>
                    <Card.Anchor
                      aria-label={`go to ${exercise.name}`}
                      href={`/exercises/${exercise.id}?from=${
                        group.date
                      }&to=${dateAsYearMonthDayFormat(
                        new Date(
                          new Date(group.date).getFullYear(),
                          new Date(group.date).getMonth() + 1,
                          0,
                        ),
                      )}`}
                    />
                    <Card.Header>
                      <Card.Title>{exercise.name}</Card.Title>
                    </Card.Header>

                    <LineGraph data={exercise.data} />
                  </Card.Root>
                </ErrorBoundary>
              ))}

              <ErrorBoundary FallbackComponent={CardErrorFallback}>
                <Card.Root>
                  <Card.Header>
                    <Card.Title>exercises count</Card.Title>
                  </Card.Header>

                  <RadarGraph
                    data={group.exercises.map((exercise) => ({
                      exerciseName: exercise.name,
                      frequency: exercise.data.length,
                    }))}
                  />
                </Card.Root>
              </ErrorBoundary>

              <ErrorBoundary FallbackComponent={CardErrorFallback}>
                <Card.Root>
                  <Card.Header>
                    <Card.Title>heatmap</Card.Title>
                  </Card.Header>

                  <HeatmapGraph data={prepareHeatmapData(group.exercises)} />
                </Card.Root>
              </ErrorBoundary>

              <ErrorBoundary FallbackComponent={CardErrorFallback}>
                <Card.Root>
                  <Card.Header>
                    <Card.Title>random facts</Card.Title>
                  </Card.Header>

                  <RandomFacts exercises={group.exercises} />
                </Card.Root>
              </ErrorBoundary>
            </GridLayout>
          </Timeline>
        </ErrorBoundary>
      ))}
    </>
  );
};

const getExercisesByMonth = (exercises: RouterOutputs["exercise"]["all"]) => {
  const exercisesByMonth: Array<{
    date: string;
    exercises: RouterOutputs["exercise"]["all"];
  }> = [];

  for (const exercise of exercises) {
    for (const data of exercise.data) {
      const firstDayOfMonthDate = dateAsYearMonthDayFormat(
        new Date(new Date(data.doneAt).setDate(1)),
      );

      const entry = exercisesByMonth.find(
        (entry) => entry.date === firstDayOfMonthDate,
      );

      if (!entry) {
        exercisesByMonth.push({
          date: firstDayOfMonthDate,
          exercises: [{ ...exercise, data: [data] }],
        });
        continue;
      }

      const exerciseInEntry = entry.exercises.find(
        (ex) => ex.id === exercise.id,
      );

      if (!exerciseInEntry) {
        entry.exercises.push({ ...exercise, data: [data] });
        continue;
      }

      exerciseInEntry.data.push(data);
    }
  }

  return exercisesByMonth.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
};

const TimelineSkeleton = () => {
  return (
    <Timeline>
      <Badge variant="accent" className="w-max">
        month
      </Badge>

      <GridSkeleton />
    </Timeline>
  );
};
