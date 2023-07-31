import { getExercises } from "@/fakeData";
import { DragComponent, SortableGrid } from "./sortableGrid";
import { GridItem } from "../_grid/gridItem";
import { LineGraph } from "../_graphs/lineGraph";
import { RadarGraph } from "../_graphs/radarGraph";
import type { ComponentProps } from "react";

const AllExercisesGrid = () => {
  const exercises = getExercises();

  return (
    <Container>
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
                    <GridItem.ExerciseDropDown />
                    <DragComponent id={exercise.id} />
                  </GridItem.ActionContainer>
                </GridItem.Header>

                <LineGraph data={exercise.data} />
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
                      frequency: exercise.data.length,
                    }))}
                  />
                </GridItem.Root>
              ),
            },
          ])}
      />
    </Container>
  );
};

export default AllExercisesGrid;

const Container = (props: ComponentProps<"div">) => {
  return <div {...props} className="space-y-1" />;
};
