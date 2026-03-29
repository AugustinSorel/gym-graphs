import { useExercise } from "~/domains/exercise/hooks/use-exercise";

export const exerciseMock: ReturnType<typeof useExercise>["data"] = {
  id: 30,
  name: "bench press",
  tileId: 1,
};
