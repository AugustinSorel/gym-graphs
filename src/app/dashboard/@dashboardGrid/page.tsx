import { getExercises } from "@/fakeData";
import { DashboardGrid } from "./exercisesGrid";
import ExerciseCard from "./exerciseCard";

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
