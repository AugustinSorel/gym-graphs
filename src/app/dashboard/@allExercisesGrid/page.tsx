import { DragComponent, SortableGrid } from "./sortableGrid";
import { GridItem } from "../_grid/gridItem";
import { LineGraph } from "../_graphs/lineGraph";
import { RadarGraph } from "../_graphs/radarGraph";
import { db } from "@/db";
import { exercises, exerciseGridPosition } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { GridLayout } from "../_grid/gridLayout";
//TODO: optimistic update when adding / updating / removing exercise

const AllExercisesGrid = async () => {
  const session = await getServerSession(authOptions);

  if (!session || !session.user.id) {
    return redirect("/");
  }

  const exercisesWithGridPosition = await db
    .select()
    .from(exercises)
    .where(eq(exercises.userId, session.user.id))
    .innerJoin(
      exerciseGridPosition,
      eq(exercises.id, exerciseGridPosition.exerciseId)
    )
    .orderBy(desc(exerciseGridPosition.gridPosition));

  return (
    <GridLayout>
      <SortableGrid
        gridItems={exercisesWithGridPosition.map(({ exercise }) => ({
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
        }))}
      />

      <GridItem.Root>
        <GridItem.Header>
          <GridItem.Title>exercises count</GridItem.Title>
        </GridItem.Header>

        <RadarGraph
          data={exercisesWithGridPosition.map(({ exercise }) => ({
            exerciseName: exercise.name,
            //FIXME:remove 0 and use exercise.data.length instead
            frequency: 0,
          }))}
        />
      </GridItem.Root>
    </GridLayout>
  );
};

export default AllExercisesGrid;
