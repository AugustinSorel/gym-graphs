import { tagsMock } from "~/domains/tag/tag.mock";
import { useExercise } from "~/domains/exercise/hooks/use-exercise";

export const exerciseMock: ReturnType<typeof useExercise>["data"] = {
  id: 30,
  createdAt: new Date("2025-01-09T11:32:12.498Z").toString(),
  updatedAt: new Date("2025-01-09T11:32:12.498Z").toString(),
  exerciseOverviewTile: {
    id: 0,
    exerciseId: 30,
    createdAt: new Date().toString(),
    updatedAt: new Date().toString(),
    tileId: 1,
    tile: {
      dashboardId: 0,
      id: 0,
      index: 0,
      name: "bench press",
      updatedAt: new Date().toString(),
      createdAt: new Date().toString(),
      tileToTags: tagsMock
        .filter((tag) => tag.name === "chest")
        .map((tag) => ({
          tileId: 0,
          tagId: tag.id,
          tag,
          createdAt: new Date().toString(),
          updatedAt: new Date().toString(),
        })),
    },
  },
  sets: [
    {
      id: 79,
      exerciseId: 30,
      weightInKg: 20,
      repetitions: 20,
      doneAt: new Date("2025-01-08T00:00:00.000Z").toString(),
      createdAt: new Date("2025-01-09T11:32:12.498Z").toString(),
      updatedAt: new Date("2025-01-09T11:32:12.498Z").toString(),
    },
    {
      id: 80,
      exerciseId: 30,
      weightInKg: 30,
      repetitions: 40,
      doneAt: new Date("2025-01-10T00:00:00.000Z").toString(),
      createdAt: new Date("2025-01-09T11:32:12.498Z").toString(),
      updatedAt: new Date("2025-01-09T11:32:12.498Z").toString(),
    },
    {
      id: 81,
      exerciseId: 30,
      weightInKg: 40,
      repetitions: 40,
      doneAt: new Date("2025-01-12T00:00:00.000Z").toString(),
      createdAt: new Date("2025-01-09T11:32:12.498Z").toString(),
      updatedAt: new Date("2025-01-09T11:32:12.498Z").toString(),
    },
    {
      id: 82,
      exerciseId: 30,
      weightInKg: 30,
      repetitions: 30,
      doneAt: new Date("2025-01-15T00:00:00.000Z").toString(),
      createdAt: new Date("2025-01-09T11:32:12.498Z").toString(),
      updatedAt: new Date("2025-01-09T11:32:12.498Z").toString(),
    },
    {
      id: 83,
      exerciseId: 30,
      weightInKg: 10,
      repetitions: 10,
      doneAt: new Date("2025-01-16T00:00:00.000Z").toString(),
      createdAt: new Date("2025-01-09T11:32:12.498Z").toString(),
      updatedAt: new Date("2025-01-09T11:32:12.498Z").toString(),
    },
  ],
};
