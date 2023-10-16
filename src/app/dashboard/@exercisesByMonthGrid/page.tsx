import { db } from "@/db";
import type { ExerciseWithData, User } from "@/db/types";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { dateAsYearMonthDayFormat } from "@/lib/date";
import { TimelineContainer } from "../timelineContainer";
import { Badge } from "@/components/ui/badge";
import { GridLayout } from "../_grid/gridLayout";
import { GridItem } from "../_grid/gridItem";
import { LineGraph } from "../_graphs/lineGraph";
import { RadarGraph } from "../_graphs/radarGraph";
import { HeatmapGraph } from "../_graphs/heatmapGraph";
import { prepareHeatmapData } from "../_graphs/heatmapUtils";
import type { DashboardPageProps } from "../getExercisesWhereClause";
import { getExercisesWhereClause } from "../getExercisesWhereClause";

//TODO: infinte scroll
const ExercisesByMonthGrid = async (props: DashboardPageProps) => {
  const session = await getServerSession(authOptions);

  if (!session || !session.user.id) {
    return redirect("/");
  }

  const exercises = await getExercises(session.user.id, props.searchParams);

  return (
    <>
      {getExercisesByMonth(exercises).map((group) => {
        return (
          <TimelineContainer key={dateAsYearMonthDayFormat(group.date)}>
            <Badge variant="accent" className="w-max">
              <time dateTime={dateAsYearMonthDayFormat(group.date)}>
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
                      href={`/exercises/${
                        exercise.id
                      }?from=${dateAsYearMonthDayFormat(
                        group.date
                      )}&to=${dateAsYearMonthDayFormat(
                        new Date(
                          new Date(group.date).getFullYear(),
                          new Date(group.date).getMonth() + 1,
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
            </GridLayout>
          </TimelineContainer>
        );
      })}
    </>
  );
};

export default ExercisesByMonthGrid;

type ExercisesByMonth = {
  date: Date;
  exercises: ExerciseWithData[];
}[];

const getExercisesByMonth = (exercises: ExerciseWithData[]) => {
  const exercisesByMonth: ExercisesByMonth = [];

  for (const exercise of exercises) {
    for (const data of exercise.data) {
      const firstDayOfMonthDate = new Date(new Date(data.doneAt).setDate(1));

      const entry = exercisesByMonth.find(
        (entry) => entry.date.getTime() === firstDayOfMonthDate.getTime()
      );

      if (!entry) {
        exercisesByMonth.push({
          date: firstDayOfMonthDate,
          exercises: [{ ...exercise, data: [data] }],
        });
        continue;
      }

      const exerciseInEntry = entry.exercises.find(
        (ex) => ex.id === exercise.id
      );

      if (!exerciseInEntry) {
        entry.exercises.push({ ...exercise, data: [data] });
        continue;
      }

      exerciseInEntry.data.push(data);
    }
  }

  return exercisesByMonth.sort((a, b) => b.date.getTime() - a.date.getTime());
};

const getExercises = (
  userId: User["id"],
  searchParams: DashboardPageProps["searchParams"]
) => {
  return db.query.exercises.findMany({
    with: {
      data: { orderBy: (data, { desc }) => [desc(data.doneAt)] },
    },
    where: () => getExercisesWhereClause({ searchParams, userId }),
  });
};
