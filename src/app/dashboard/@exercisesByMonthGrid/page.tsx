import { GridLayout } from "../_grid/gridLayout";
import { GridItem } from "../_grid/gridItem";
import { LineGraph } from "../_graphs/lineGraph";
import { RadarGraph } from "../_graphs/radarGraph";
import { dateAsYearMonthDayFormat } from "@/lib/date";
import { Badge } from "@/components/ui/badge";
import { TimelineContainer } from "../timelineContainer";
import { db } from "@/db";
import type { Exercise, ExerciseData, User } from "@/db/types";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { HeatmapGraph } from "../_graphs/heatmapGraph";

//TODO: infinte scroll
//TODO: date graph
const ExercisesByMonthGrid = async () => {
  const session = await getServerSession(authOptions);

  if (!session || !session.user.id) {
    return redirect("/");
  }

  const exercises = await getExercises(session.user.id);

  const exercisesByMonth = getExercisesByMonth(exercises);

  return (
    <>
      {exercisesByMonth.map((group) => (
        <TimelineContainer key={dateAsYearMonthDayFormat(group.date)}>
          <Badge variant="accent" className="mx-auto lg:ml-0 lg:mr-auto">
            <time dateTime={dateAsYearMonthDayFormat(group.date)}>
              {new Date(group.date).toLocaleDateString(undefined, {
                month: "long",
                year: "numeric",
              })}
            </time>
          </Badge>
          <GridLayout>
            <>
              {group.exercises.map((exercise) => (
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
              ))}

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

                <HeatmapGraph />
              </GridItem.Root>
            </>
          </GridLayout>
        </TimelineContainer>
      ))}
    </>
  );
};

export default ExercisesByMonthGrid;

type ExercisesByMonth = {
  date: Date;
  exercises: (Exercise & { data: ExerciseData[] })[];
}[];

const getExercisesByMonth = (
  exercises: (Exercise & { data: ExerciseData[] })[]
) => {
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

const getExercises = (userId: User["id"]) => {
  return db.query.exercises.findMany({
    with: {
      data: { orderBy: (data, { desc }) => [desc(data.doneAt)] },
    },
    where: (exercise, { eq }) => eq(exercise.userId, userId),
  });
};
