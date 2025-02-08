import { exercisesMock } from "~/exercise/exercise.mock";
import type { selectDashboardFunFactsAction } from "./dashboard.actions";

const favoriteExercise = exercisesMock
  .toSorted((a, b) => b.sets.length - a.sets.length)
  .at(0);

const leastFavoriteExercise = exercisesMock
  .toSorted((a, b) => a.sets.length - b.sets.length)
  .at(0);

const setsCount = exercisesMock.reduce((acc, exercise) => {
  return acc + exercise.sets.length;
}, 0);

const totalWeightInKg = exercisesMock.reduce((acc, exercise) => {
  return (
    acc +
    exercise.sets.reduce((acc, set) => {
      return acc + set.weightInKg * set.repetitions;
    }, 0)
  );
}, 0);

if (!favoriteExercise || !leastFavoriteExercise) {
  throw new Error("mock exercises is empty");
}

export const dashboardFunFactsMock: Readonly<
  Awaited<ReturnType<typeof selectDashboardFunFactsAction>>
> = {
  favoriteExercise,
  leastFavoriteExercise,
  setsCount,
  totalWeightInKg,
} as const;
