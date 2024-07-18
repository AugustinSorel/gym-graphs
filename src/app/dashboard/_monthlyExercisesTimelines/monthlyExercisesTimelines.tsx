"use client";

import { Badge } from "@/components/ui/badge";
import { dateAsYearMonthDayFormat } from "@/lib/date";
import type { RouterOutputs } from "@/trpc/react";
import { useExercises } from "../_components/useExercises";
import { GridLayout, GridSkeleton } from "@/components/ui/gridLayout";
import { CardErrorFallback } from "@/components/ui/card";
import { Timeline, TimelineErrorFallback } from "@/components/ui/timeline";
import { ErrorBoundary } from "react-error-boundary";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { Suspense } from "react";
import { prepareUserRandomFactsData } from "@/lib/math";
import { ExercisesRadarCard } from "@/components/cards/exercisesRadarCard";
import { ExerciseMonthlyOverviewCard } from "@/components/cards/exerciseOverviewCard";
import { ExerciseHeatmapCard } from "@/components/cards/exerciseHeatmapCard";
import { UserRandomFactsCard } from "@/components/cards/userRandomFactsCard";
import { prepareHeatmapData } from "@/components/graphs/heatmapUtils";

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
                  <ExerciseMonthlyOverviewCard
                    exercise={exercise}
                    month={new Date(group.date)}
                  />
                </ErrorBoundary>
              ))}

              <ErrorBoundary FallbackComponent={CardErrorFallback}>
                <ExercisesRadarCard
                  data={group.exercises.map((exercise) => ({
                    exerciseName: exercise.name,
                    frequency: exercise.data.length,
                  }))}
                />
              </ErrorBoundary>

              <ErrorBoundary FallbackComponent={CardErrorFallback}>
                <ExerciseHeatmapCard
                  data={prepareHeatmapData(group.exercises)}
                />
              </ErrorBoundary>

              <ErrorBoundary FallbackComponent={CardErrorFallback}>
                <UserRandomFactsCard
                  data={prepareUserRandomFactsData(group.exercises)}
                />
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
