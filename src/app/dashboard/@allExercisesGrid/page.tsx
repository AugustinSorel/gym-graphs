import { getExercises } from "@/fakeData";
import { SortableGrid } from "./sortableGrid";
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
          }))
          .concat([
            {
              id: "radar",
              render: (
                <GridItem
                  isDraggable
                  isModifiable={false}
                  id="radar"
                  title="exercises count"
                >
                  <RadarGraph
                    data={exercises.map((exercise) => ({
                      exerciseName: exercise.name,
                      frequency: exercise.data.length,
                    }))}
                  />
                </GridItem>
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
