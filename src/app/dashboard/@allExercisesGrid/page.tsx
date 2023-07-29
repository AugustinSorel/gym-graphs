import { getExercises } from "@/fakeData";
import { SortableGrid } from "./sortableGrid";
import { GridItem } from "../_grid/gridItem";
import { LineGraph } from "../_graphs/lineGraph";
import { RadarGraph } from "../_graphs/radarGraph";

const AllExercisesGrid = () => {
  const exercises = getExercises();

  return (
    <section className="space-y-1">
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
    </section>
  );
};

export default AllExercisesGrid;
