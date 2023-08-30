import { DragComponent, SortableGrid } from "./sortableGrid";
import { GridItem } from "../_grid/gridItem";
import { LineGraph } from "../_graphs/lineGraph";
import { RadarGraph } from "../_graphs/radarGraph";
import { db } from "@/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { GridLayout } from "../_grid/gridLayout";
import { TimelineContainer } from "../timelineContainer";
import { Badge } from "@/components/ui/badge";
//TODO: optimistic update when adding / updating / removing exercise

const AllExercisesGrid = async () => {
  const session = await getServerSession(authOptions);

  if (!session || !session.user.id) {
    return redirect("/");
  }

  const exercises = (
    await db.query.exercises.findMany({
      where: (exercise, { eq }) => eq(exercise.userId, session.user.id),
      with: {
        data: { orderBy: (data, { asc }) => [asc(data.doneAt)] },
        position: true,
      },
    })
  ).sort((a, b) => b.position.gridPosition - a.position.gridPosition);

  return (
    <TimelineContainer>
      <Badge variant="accent" className="mx-auto lg:ml-0 lg:mr-auto">
        <time dateTime="all">all</time>
      </Badge>
      <GridLayout>
        <SortableGrid
          gridItems={exercises.map((exercise) => ({
            id: exercise.id,
            render: (
              <GridItem.Root>
                <GridItem.Anchor href={`/exercises/${exercise.id}`} />
                <GridItem.Header>
                  <GridItem.Title>{exercise.name}</GridItem.Title>

                  <GridItem.ActionContainer>
                    <GridItem.ExerciseDropDown exercise={exercise} />
                    <DragComponent id={exercise.id} />
                  </GridItem.ActionContainer>
                </GridItem.Header>

                <LineGraph data={exercise.data} />
              </GridItem.Root>
            ),
          }))}
        />

        <GridItem.Root>
          <GridItem.Header>
            <GridItem.Title>exercises count</GridItem.Title>
          </GridItem.Header>

          <RadarGraph
            data={exercises.map((exercise) => ({
              exerciseName: exercise.name,
              frequency: exercise.data.length,
            }))}
          />
        </GridItem.Root>
      </GridLayout>
    </TimelineContainer>
  );
};

export default AllExercisesGrid;
