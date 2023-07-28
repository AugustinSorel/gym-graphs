import { Exercise, getExercises } from "@/fakeData";
import { SortableGrid } from "./_grid/sortableGrid";
import { GridItem } from "./_grid/gridItem";
import { GridLayout } from "./_grid/gridLayout";
import { dateAsYearMonthDayFormat } from "@/lib/date";

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
        <SortableGrid exercises={exercises} />
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
                  gridItem={{
                    ...exercise,
                    href: `/exercises/${exercise.name}?from=${
                      group.date
                    }&to=${dateAsYearMonthDayFormat(
                      new Date(
                        new Date(group.date).getFullYear(),
                        new Date(group.date).getMonth() + 1,
                        0
                      )
                    )}`,
                    itemType: "line",
                    isDraggable: false,
                    isModifiable: false,
                  }}
                />
              ))}
              <GridItem
                gridItem={{
                  id: "radar",
                  name: "radar",
                  gridIndex: 0,
                  itemType: "radar" as const,
                  isDraggable: false,
                  isModifiable: false,
                  data: group.exercises.map((exercise) => ({
                    exerciseName: exercise.name,
                    frequency: exercise.data.length,
                  })),
                }}
              />
            </>
          </GridLayout>
        </section>
      ))}
    </>
  );
};

export default Page;
