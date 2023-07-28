import { Exercise, getExercises } from "@/fakeData";
import { SortableGrid } from "./_grid/sortableGrid";
import { GridItem } from "./_grid/gridItem";
import { GridLayout } from "./_grid/gridLayout";
import { dateAsYearMonthDayFormat } from "@/lib/date";
import { LineGraph } from "./_graphs/lineGraph";
import { RadarGraph } from "./_graphs/radarGraph";

type ExercisesByMonth = {
  date: string;
  exercises: Exercise[];
}[];

const getExercisesByMonth = (exercises: Exercise[]) => {
  let exercisesByMonth: ExercisesByMonth = [];

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

const Page = () => {
  const exercises = getExercises();
  const exercisesByMonth = getExercisesByMonth(exercises);

  return (
    <>
      <section className="space-y-1">
        <h1 className="-mt-5 text-sm font-semibold text-muted-foreground">
          All
        </h1>
        <SortableGrid
          items={exercises
            .map((exercise) => ({
              render: (
                <GridItem
                  isDraggable
                  isModifiable
                  id={exercise.id}
                  title={exercise.name}
                  href={`/exercises/${exercise.name}`}
                >
                  <LineGraph data={exercise.data} />
                </GridItem>
              ),
              id: exercise.id,
            }))
            .concat([
              {
                render: (
                  <GridItem
                    isDraggable
                    isModifiable={false}
                    id="radar"
                    title="radar"
                  >
                    <RadarGraph
                      data={exercises.map((exercise) => ({
                        exerciseName: exercise.name,
                        frequency: exercise.data.length,
                      }))}
                    />
                  </GridItem>
                ),
                id: "radar",
              },
            ])}
        />
      </section>
      {exercisesByMonth.map((group) => (
        <section className="space-y-1">
          <h1 className="text-sm font-semibold text-muted-foreground">
            {new Date(group.date).toLocaleDateString(undefined, {
              month: "long",
              year: "numeric",
            })}
          </h1>
          <GridLayout>
            <>
              {group.exercises.map((exercise) => (
                <GridItem
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
                title="radar"
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
        </section>
      ))}
    </>
  );
};

export default Page;
