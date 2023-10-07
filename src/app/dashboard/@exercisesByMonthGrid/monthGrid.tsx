"use client";

import type { Exercise, ExerciseData } from "@/db/types";
import { TimelineContainer } from "../timelineContainer";
import { dateAsYearMonthDayFormat } from "@/lib/date";
import { Badge } from "@/components/ui/badge";
import { GridItem } from "../_grid/gridItem";
import { RadarGraph } from "../_graphs/radarGraph";
import { HeatmapGraph } from "../_graphs/heatmapGraph";
import { prepareHeatmapData } from "../_graphs/heatmapUtils";
import { GridLayout } from "../_grid/gridLayout";
import { LineGraph } from "../_graphs/lineGraph";
import { useDashboardFilters } from "../dashboardFiltersContext";

type ExerciseByMonth = {
  date: Date;
  exercises: (Exercise & { data: ExerciseData[] })[];
};

type Props = {
  exerciseByMonth: ExerciseByMonth;
};

export const MonthGrid = ({ exerciseByMonth }: Props) => {
  const dashboardFilters = useDashboardFilters();

  const filteredExercises = dashboardFilters.apply(exerciseByMonth.exercises);

  if (filteredExercises.length < 1) {
    return null;
  }

  return (
    <TimelineContainer key={dateAsYearMonthDayFormat(exerciseByMonth.date)}>
      <Badge variant="accent" className="mx-auto lg:ml-0 lg:mr-auto">
        <time dateTime={dateAsYearMonthDayFormat(exerciseByMonth.date)}>
          {new Date(exerciseByMonth.date).toLocaleDateString(undefined, {
            month: "long",
            year: "numeric",
          })}
        </time>
      </Badge>
      <GridLayout>
        {filteredExercises.map((exercise) => {
          return (
            <GridItem.Root key={exercise.id}>
              <GridItem.Anchor
                aria-label={`go to ${exercise.name}`}
                href={`/exercises/${
                  exercise.id
                }?from=${dateAsYearMonthDayFormat(
                  exerciseByMonth.date
                )}&to=${dateAsYearMonthDayFormat(
                  new Date(
                    new Date(exerciseByMonth.date).getFullYear(),
                    new Date(exerciseByMonth.date).getMonth() + 1,
                    0
                  )
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
            data={filteredExercises.map((exercise) => ({
              exerciseName: exercise.name,
              frequency: exercise.data.length,
            }))}
          />
        </GridItem.Root>

        <GridItem.Root>
          <GridItem.Header>
            <GridItem.Title>heatmap</GridItem.Title>
          </GridItem.Header>

          <HeatmapGraph data={prepareHeatmapData(filteredExercises)} />
        </GridItem.Root>
      </GridLayout>
    </TimelineContainer>
  );
};
