"use client";

import { Badge } from "@/components/ui/badge";
import { dateAsYearMonthDayFormat } from "@/lib/date";
import type { RouterOutputs } from "@/trpc/react";
import { useExercises } from "../_components/useExercises";
import { GridLayout } from "../_components/grid/gridLayout";
import { GridItem, GridItemErrorBoundary } from "../_components/grid/gridItem";
import { LineGraph } from "../_components/graphs/lineGraph";
import { RadarGraph } from "../_components/graphs/radarGraph";
import { HeatmapGraph } from "../_components/graphs/heatmapGraph";
import { prepareHeatmapData } from "../_components/graphs/heatmapUtils";
import { RandomFacts } from "../_components/graphs/randomFacts";
import { Timeline } from "../_components/timeline";
import { ErrorBoundary } from "react-error-boundary";

export const MonthlyExercisesTimeline = () => {
  const exercises = useExercises();

  return (
    <>
      {getExercisesByMonth(exercises).map((group) => (
        <Timeline key={group.date}>
          <Badge variant="accent" className="w-max">
            <time dateTime={group.date}>
              {new Date(group.date).toLocaleDateString(undefined, {
                month: "long",
                year: "numeric",
              })}
            </time>
          </Badge>
          <GridLayout>
            {group.exercises.map((exercise) => {
              return (
                <ErrorBoundary
                  FallbackComponent={GridItemErrorBoundary}
                  key={exercise.id}
                >
                  <GridItem.Root>
                    <GridItem.Anchor
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
                    <GridItem.Header>
                      <GridItem.Title>{exercise.name}</GridItem.Title>
                    </GridItem.Header>

                    <LineGraph data={exercise.data} />
                  </GridItem.Root>
                </ErrorBoundary>
              );
            })}

            <ErrorBoundary FallbackComponent={GridItemErrorBoundary}>
              <GridItem.Root>
                <GridItem.Header>
                  <GridItem.Title>exercises count</GridItem.Title>
                </GridItem.Header>

                <RadarGraph
                  data={group.exercises.map((exercise) => ({
                    exerciseName: exercise.name,
                    frequency: exercise.data.length,
                  }))}
                />
              </GridItem.Root>
            </ErrorBoundary>

            <ErrorBoundary FallbackComponent={GridItemErrorBoundary}>
              <GridItem.Root>
                <GridItem.Header>
                  <GridItem.Title>heatmap</GridItem.Title>
                </GridItem.Header>

                <HeatmapGraph data={prepareHeatmapData(group.exercises)} />
              </GridItem.Root>
            </ErrorBoundary>

            <ErrorBoundary FallbackComponent={GridItemErrorBoundary}>
              <GridItem.Root>
                <GridItem.Header>
                  <GridItem.Title>random facts</GridItem.Title>
                </GridItem.Header>

                <RandomFacts exercises={group.exercises} />
              </GridItem.Root>
            </ErrorBoundary>
          </GridLayout>
        </Timeline>
      ))}
    </>
  );
};

type ExercisesByMonth = Array<{
  date: string;
  exercises: RouterOutputs["exercise"]["all"];
}>;

const getExercisesByMonth = (exercises: RouterOutputs["exercise"]["all"]) => {
  const exercisesByMonth: ExercisesByMonth = [];

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
