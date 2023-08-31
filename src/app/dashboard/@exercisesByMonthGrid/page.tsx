import { GridLayout } from "../_grid/gridLayout";
import { GridItem } from "../_grid/gridItem";
import { LineGraph } from "../_graphs/lineGraph";
import { RadarGraph } from "../_graphs/radarGraph";
import { dateAsYearMonthDayFormat } from "@/lib/date";
import { Badge } from "@/components/ui/badge";
import { TimelineContainer } from "../timelineContainer";
import { db } from "@/db";
import type { Exercise, ExerciseData } from "@/db/types";

//TODO: infinte scroll
//TODO: date graph
const ExercisesByMonthGrid = async () => {
  const exercises = await db.query.exercises.findMany({
    with: {
      data: { orderBy: (data, { desc }) => [desc(data.doneAt)] },
    },
  });

  const exercisesByMonth = getExercisesByMonth(exercises);

  return (
    <>
      {exercisesByMonth.map((group) => (
        <TimelineContainer key={group.date}>
          <Badge variant="accent" className="mx-auto lg:ml-0 lg:mr-auto">
            <time dateTime={group.date}>
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
                    href={`/exercises/${exercise.name}?from=${
                      group.date
                    }&to=${dateAsYearMonthDayFormat(
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
            </>
          </GridLayout>
        </TimelineContainer>
      ))}
    </>
  );
};

export default ExercisesByMonthGrid;

type ExercisesByMonth = {
  date: string;
  exercises: (Exercise & { data: ExerciseData[] })[];
}[];

const getExercisesByMonth = (
  exercises: (Exercise & { data: ExerciseData[] })[]
) => {
  const exercisesByMonth: ExercisesByMonth = [];

  for (const exercise of exercises) {
    for (const data of exercise.data) {
      const firstDayOfMonthDate = new Date(new Date(data.doneAt).setDate(1));
      const date = dateAsYearMonthDayFormat(firstDayOfMonthDate);

      const entry = exercisesByMonth.find((entry) => entry.date === date);

      if (!entry) {
        exercisesByMonth.push({
          date,
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

  return exercisesByMonth;
};
