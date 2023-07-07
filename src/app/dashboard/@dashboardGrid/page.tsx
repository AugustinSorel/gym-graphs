import { getExercises } from "@/fakeData";
import { DashboardGrid } from "./grid";
import ExerciseCard from "./card";

export default async function Page() {
  const exercises = await getExercises();

  return (
    <DashboardGrid>
      {exercises.map((exercise) => (
        <ExerciseCard key={exercise.id} exercise={exercise} />
      ))}
    </DashboardGrid>
  );
}
