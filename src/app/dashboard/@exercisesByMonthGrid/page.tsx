import { getExercises } from "@/fakeData";
import type { Exercise } from "@/fakeData";
import { GridLayout } from "../_grid/gridLayout";
import { GridItem } from "../_grid/gridItem";
import { LineGraph } from "../_graphs/lineGraph";
import { RadarGraph } from "../_graphs/radarGraph";
import { dateAsYearMonthDayFormat } from "@/lib/date";
import type { ComponentProps } from "react";

//TODO: infinte scroll
//TODO: html validator
const ExercisesByMonthGrid = () => {
  const exercises = getExercises();
  const exercisesByMonth = getExercisesByMonth(exercises);

  return (
    <>
      {exercisesByMonth.map((group) => (
        <Container
          key={group.date}
          data-date={new Date(group.date).toLocaleDateString(undefined, {
            month: "long",
            year: "numeric",
          })}
        >
          <GridLayout>
            <>
              {group.exercises.map((exercise) => (
                <GridItem
                  key={exercise.id}
                  isDraggable={false}
                  isModifiable={false}
                  id={exercise.id}
                  title={exercise.name}
                  href={`/exercises/${exercise.name}?from=${
                    group.date
                  }&to=${dateAsYearMonthDayFormat(
                    new Date(
                      new Date(group.date).getFullYear(),
                      new Date(group.date).getMonth() + 1,
                      0
                    )
                  )}`}
                >
                  <LineGraph data={exercise.data} />
                </GridItem>
              ))}
              <GridItem
                id="radar"
                isDraggable={false}
                isModifiable={false}
                title="exercises count"
              >
                <RadarGraph
                  data={group.exercises.map((exercise) => ({
                    exerciseName: exercise.name,
                    frequency: exercise.data.length,
                  }))}
                />
              </GridItem>
            </>
          </GridLayout>
        </Container>
      ))}
    </>
  );
};

export default ExercisesByMonthGrid;

type ExercisesByMonth = {
  date: string;
  exercises: Exercise[];
}[];

const getExercisesByMonth = (exercises: Exercise[]) => {
  const exercisesByMonth: ExercisesByMonth = [];

  for (const exercise of exercises) {
    for (const data of exercise.data) {
      const firstDayOfMonthDate = new Date(new Date(data.date).setDate(1));
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

const Container = (props: ComponentProps<"div">) => {
  return (
    <div
      {...props}
      className="mt-16 text-center before:mb-5 before:block before:text-center before:text-5xl before:font-bold before:text-border before:content-[attr(data-date)]"
    />
  );
};
