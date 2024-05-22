"use client";

import { HeatmapGraph } from "@/app/dashboard/_graphs/heatmapGraph";
import { prepareHeatmapData } from "@/app/dashboard/_graphs/heatmapUtils";
import { LineGraph } from "@/app/dashboard/_graphs/lineGraph";
import { RadarGraph } from "@/app/dashboard/_graphs/radarGraph";
import { RandomFacts } from "@/app/dashboard/_graphs/randomFacts";
import { GridItem } from "@/app/dashboard/_grid/gridItem";
import { GridLayout } from "@/app/dashboard/_grid/gridLayout";
import { TimelineContainer } from "@/app/dashboard/timelineContainer";
import { Badge } from "@/components/ui/badge";
import { dateAsYearMonthDayFormat } from "@/lib/date";
import type { RouterOutputs } from "@/trpc/react";
import { useExercises } from "../useExercises";

export const MonthlyExercisesTimeline = () => {
  const exercises = useExercises();

  return (
    <>
      {getExercisesByMonth(exercises).map((group) => (
        <TimelineContainer key={group.date}>
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
                <GridItem.Root key={exercise.id}>
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
              );
            })}

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

            <GridItem.Root>
              <GridItem.Header>
                <GridItem.Title>heatmap</GridItem.Title>
              </GridItem.Header>

              <HeatmapGraph data={prepareHeatmapData(group.exercises)} />
            </GridItem.Root>

            <GridItem.Root>
              <GridItem.Header>
                <GridItem.Title>random facts</GridItem.Title>
              </GridItem.Header>

              <RandomFacts exercises={group.exercises} />
            </GridItem.Root>
          </GridLayout>
        </TimelineContainer>
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
