import { getExercises } from "@/fakeData";
import { DashboardGrid } from "./grid";
import ExerciseCard from "./card";

export default function Page() {
  const exercises = getExercises();

  return (
    <DashboardGrid>
      {exercises.map((exercise) => (
        <ExerciseCard key={exercise.id} exercise={exercise} />
      ))}
    </DashboardGrid>
  );
}
