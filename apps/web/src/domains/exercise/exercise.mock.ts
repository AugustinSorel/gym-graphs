import { exerciseQueries } from "~/domains/exercise/exercise.queries";

type ExerciseData = Awaited<ReturnType<NonNullable<ReturnType<typeof exerciseQueries.get>["queryFn"]>>>;

export const exerciseMock: ExerciseData = {
  id: 30,
  name: "bench press",
  tileId: 1,
};
