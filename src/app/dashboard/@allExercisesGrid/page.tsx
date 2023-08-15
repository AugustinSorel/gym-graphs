import { DragComponent, SortableGrid } from "./sortableGrid";
import { GridItem } from "../_grid/gridItem";
import { LineGraph } from "../_graphs/lineGraph";
import { RadarGraph } from "../_graphs/radarGraph";
import { db } from "@/db";
import { exercise } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
//TODO: optimistic update when adding / updating / removing exercise

const AllExercisesGrid = async () => {
  const session = await getServerSession(authOptions);

  await new Promise((res) => setTimeout(res, 5000));

  if (!session || !session.user.id) {
    return redirect("/");
  }

  //TODO: order by gridIndex
  const exercises = await db
    .select()
    .from(exercise)
    .where(eq(exercise.userId, session.user.id))
    .orderBy(desc(exercise.createdAt));

  return (
    <SortableGrid
      items={exercises
        .map((exercise) => ({
          id: exercise.id,
          render: (
            <GridItem.Root>
              <GridItem.Anchor href={`/exercises/${exercise.name}`} />
              <GridItem.Header>
                <GridItem.Title>{exercise.name}</GridItem.Title>

                <GridItem.ActionContainer>
                  <GridItem.ExerciseDropDown exercise={exercise} />
                  <DragComponent id={exercise.id} />
                </GridItem.ActionContainer>
              </GridItem.Header>

              {/*FIXME: remove [] to exercise.data instead */}
              <LineGraph data={[]} />
            </GridItem.Root>
          ),
        }))
        .concat([
          {
            id: "radar",
            render: (
              <GridItem.Root>
                <GridItem.Header>
                  <GridItem.Title>exercises count</GridItem.Title>

                  <GridItem.ActionContainer>
                    <DragComponent id="radar" />
                  </GridItem.ActionContainer>
                </GridItem.Header>

                <RadarGraph
                  data={exercises.map((exercise) => ({
                    exerciseName: exercise.name,
                    //FIXME:remove 0 and use exercise.data.length instead
                    frequency: 0,
                  }))}
                />
              </GridItem.Root>
            ),
          },
        ])}
    />
  );
};

export default AllExercisesGrid;
