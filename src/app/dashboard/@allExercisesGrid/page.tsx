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
import type { ComponentProps } from "react";
import {
  ExerciseDropDown,
  ExerciseTagsComboBox,
} from "../_grid/gridItemActions";
import { MoreHorizontal, Tag } from "lucide-react";
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
        tags: { orderBy: (data, { asc }) => [asc(data.text)] },
        position: true,
      },
    })
  ).sort((a, b) => b.position.gridPosition - a.position.gridPosition);

  if (exercises.length < 1) {
    return (
      <Container>
        <Title>no data</Title>
        <Text>
          Your dashboard is empty
          <br />
          Start adding new data with the form above
        </Text>
      </Container>
    );
  }

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
                <GridItem.Anchor
                  aria-label={`go to ${exercise.name}`}
                  href={`/exercises/${exercise.id}`}
                />
                <GridItem.Header>
                  <GridItem.Title>{exercise.name}</GridItem.Title>

                  <GridItem.ActionContainer>
                    <ExerciseTagsComboBox
                      exerciseId={exercise.id}
                      exerciseTags={exercise.tags}
                    >
                      <GridItem.ActionButton aria-label="view exercise tags">
                        <Tag className="h-4 w-4" />
                      </GridItem.ActionButton>
                    </ExerciseTagsComboBox>

                    <ExerciseDropDown exercise={exercise}>
                      <GridItem.ActionButton aria-label="view more">
                        <MoreHorizontal className="h-4 w-4" />
                      </GridItem.ActionButton>
                    </ExerciseDropDown>

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

const Container = (props: ComponentProps<"div">) => {
  return (
    <div
      {...props}
      className="mt-10 flex flex-col items-center space-y-5 text-center"
    />
  );
};

const Title = (props: ComponentProps<"h1">) => {
  return <h1 {...props} className="text-6xl font-bold uppercase" />;
};

const Text = (props: ComponentProps<"p">) => {
  return <p {...props} className="text-xl text-muted-foreground" />;
};
