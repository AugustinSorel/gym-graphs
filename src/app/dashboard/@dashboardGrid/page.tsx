import { Exercise, getExercises } from "@/fakeData";
import { SortableGrid } from "./_grid/sortableGrid";
import { GridItem } from "./_grid/gridItem";
import { GridLayout } from "./_grid/gridLayout";

type D = {
  date: string;
  exercises: Exercise[];
}[];

const Page = () => {
  const exercises = getExercises();

  let res: D = [];

  for (const exercise of exercises) {
    for (const data of exercise.data) {
      const date = new Date(new Date(data.date).setDate(1)).toLocaleDateString(
        "us-us",
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }
      );

      const entry = res.find((entry) => entry.date === date);

      if (!entry) {
        res.push({ date, exercises: [{ ...exercise, data: [data] }] });
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

  return (
    <>
      <section className="space-y-1">
        <h1 className="-mt-5 text-sm font-semibold text-muted-foreground">
          All
        </h1>
        <SortableGrid exercises={exercises} />
      </section>
      {res.map((group) => (
        <section className="space-y-1">
          <h1 className="text-sm font-semibold text-muted-foreground">
            {new Date(group.date).toLocaleDateString("us-us", {
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
