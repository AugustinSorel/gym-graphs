import { tagsMock } from "~/tag/tag.mock";
import type { selectTagsFrequencyAction } from "~/tag/tag.actions";
import type {
  selectExerciseAction,
  selectExercisesFrequencyAction,
} from "~/exercise/exercise.actions";

export const exercisesMock: ReadonlyArray<
  Awaited<ReturnType<typeof selectExerciseAction>>
> = [
  {
    id: 30,
    userId: 7,
    name: "bench press",
    createdAt: new Date("2025-01-09T11:32:12.498Z"),
    updatedAt: new Date("2025-01-09T11:32:12.498Z"),
    tags: tagsMock
      .filter((tag) => tag.name === "chest")
      .map((tag) => ({
        exerciseId: 30,
        tagId: tag.id,
        tag,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    sets: [
      {
        id: 79,
        exerciseId: 30,
        weightInKg: 20,
        repetitions: 20,
        doneAt: new Date("2025-01-08T00:00:00.000Z"),
        createdAt: new Date("2025-01-09T11:32:12.498Z"),
        updatedAt: new Date("2025-01-09T11:32:12.498Z"),
      },
      {
        id: 80,
        exerciseId: 30,
        weightInKg: 30,
        repetitions: 40,
        doneAt: new Date("2025-01-10T00:00:00.000Z"),
        createdAt: new Date("2025-01-09T11:32:12.498Z"),
        updatedAt: new Date("2025-01-09T11:32:12.498Z"),
      },
      {
        id: 81,
        exerciseId: 30,
        weightInKg: 40,
        repetitions: 40,
        doneAt: new Date("2025-01-12T00:00:00.000Z"),
        createdAt: new Date("2025-01-09T11:32:12.498Z"),
        updatedAt: new Date("2025-01-09T11:32:12.498Z"),
      },
      {
        id: 82,
        exerciseId: 30,
        weightInKg: 30,
        repetitions: 30,
        doneAt: new Date("2025-01-15T00:00:00.000Z"),
        createdAt: new Date("2025-01-09T11:32:12.498Z"),
        updatedAt: new Date("2025-01-09T11:32:12.498Z"),
      },
      {
        id: 83,
        exerciseId: 30,
        weightInKg: 10,
        repetitions: 10,
        doneAt: new Date("2025-01-16T00:00:00.000Z"),
        createdAt: new Date("2025-01-09T11:32:12.498Z"),
        updatedAt: new Date("2025-01-09T11:32:12.498Z"),
      },
    ],
  },
  {
    id: 31,
    userId: 7,
    name: "squat",
    createdAt: new Date("2025-01-09T11:32:12.498Z"),
    updatedAt: new Date("2025-01-09T11:32:12.498Z"),
    tags: tagsMock
      .filter((tag) => tag.name === "legs")
      .map((tag) => ({
        exerciseId: 30,
        tagId: tag.id,
        tag,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    sets: [
      {
        id: 84,
        exerciseId: 31,
        weightInKg: 10,
        repetitions: 10,
        doneAt: new Date("2025-01-09T00:00:00.000Z"),
        createdAt: new Date("2025-01-09T11:32:12.498Z"),
        updatedAt: new Date("2025-01-09T11:32:12.498Z"),
      },
      {
        id: 85,
        exerciseId: 31,
        weightInKg: 20,
        repetitions: 20,
        doneAt: new Date("2025-01-08T00:00:00.000Z"),
        createdAt: new Date("2025-01-09T11:32:12.498Z"),
        updatedAt: new Date("2025-01-09T11:32:12.498Z"),
      },
      {
        id: 86,
        exerciseId: 31,
        weightInKg: 10,
        repetitions: 10,
        doneAt: new Date("2025-01-11T00:00:00.000Z"),
        createdAt: new Date("2025-01-09T11:32:12.498Z"),
        updatedAt: new Date("2025-01-09T11:32:12.498Z"),
      },
      {
        id: 87,
        exerciseId: 31,
        weightInKg: 20,
        repetitions: 20,
        doneAt: new Date("2025-01-12T00:00:00.000Z"),
        createdAt: new Date("2025-01-09T11:32:12.498Z"),
        updatedAt: new Date("2025-01-09T11:32:12.498Z"),
      },
    ],
  },
  {
    id: 32,
    userId: 7,
    name: "deadlift",
    createdAt: new Date("2025-01-09T11:32:12.498Z"),
    updatedAt: new Date("2025-01-09T11:32:12.498Z"),
    tags: tagsMock
      .filter((tag) => tag.name === "legs" || tag.name === "calfs")
      .map((tag) => ({
        exerciseId: 30,
        tagId: tag.id,
        tag,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    sets: [
      {
        id: 90,
        exerciseId: 32,
        weightInKg: 30,
        repetitions: 30,
        doneAt: new Date("2025-01-11T00:00:00.000Z"),
        createdAt: new Date("2025-01-09T11:32:12.498Z"),
        updatedAt: new Date("2025-01-09T11:32:12.498Z"),
      },
      {
        id: 91,
        exerciseId: 32,
        weightInKg: 10,
        repetitions: 10,
        doneAt: new Date("2025-01-20T00:00:00.000Z"),
        createdAt: new Date("2025-01-09T11:32:12.498Z"),
        updatedAt: new Date("2025-01-09T11:32:12.498Z"),
      },
      {
        id: 92,
        exerciseId: 32,
        weightInKg: 40,
        repetitions: 40,
        doneAt: new Date("2025-01-24T00:00:00.000Z"),
        createdAt: new Date("2025-01-09T11:32:12.498Z"),
        updatedAt: new Date("2025-01-09T11:32:12.498Z"),
      },
      {
        id: 93,
        exerciseId: 32,
        weightInKg: 40,
        repetitions: 40,
        doneAt: new Date("2025-01-26T00:00:00.000Z"),
        createdAt: new Date("2025-01-09T11:32:12.498Z"),
        updatedAt: new Date("2025-01-09T11:32:12.498Z"),
      },
      {
        id: 94,
        exerciseId: 32,
        weightInKg: 10,
        repetitions: 10,
        doneAt: new Date("2025-01-27T00:00:00.000Z"),
        createdAt: new Date("2025-01-09T11:32:12.498Z"),
        updatedAt: new Date("2025-01-09T11:32:12.498Z"),
      },
      {
        id: 95,
        exerciseId: 32,
        weightInKg: 30,
        repetitions: 30,
        doneAt: new Date("2025-01-28T00:00:00.000Z"),
        createdAt: new Date("2025-01-09T11:32:12.498Z"),
        updatedAt: new Date("2025-01-09T11:32:12.498Z"),
      },
    ],
  },
  {
    id: 33,
    userId: 7,
    name: "biceps curls",
    createdAt: new Date("2025-01-09T11:32:12.498Z"),
    updatedAt: new Date("2025-01-09T11:32:12.498Z"),
    tags: [],
    sets: [
      {
        id: 100,
        exerciseId: 32,
        weightInKg: 30,
        repetitions: 30,
        doneAt: new Date("2025-01-03T00:00:00.000Z"),
        createdAt: new Date("2025-01-09T11:32:12.498Z"),
        updatedAt: new Date("2025-01-09T11:32:12.498Z"),
      },
      {
        id: 101,
        exerciseId: 32,
        weightInKg: 50,
        repetitions: 30,
        doneAt: new Date("2025-01-08T00:00:00.000Z"),
        createdAt: new Date("2025-01-09T11:32:12.498Z"),
        updatedAt: new Date("2025-01-09T11:32:12.498Z"),
      },
      {
        id: 102,
        exerciseId: 32,
        weightInKg: 40,
        repetitions: 20,
        doneAt: new Date("2025-01-12T00:00:00.000Z"),
        createdAt: new Date("2025-01-09T11:32:12.498Z"),
        updatedAt: new Date("2025-01-09T11:32:12.498Z"),
      },
      {
        id: 103,
        exerciseId: 32,
        weightInKg: 40,
        repetitions: 50,
        doneAt: new Date("2025-01-13T00:00:00.000Z"),
        createdAt: new Date("2025-01-09T11:32:12.498Z"),
        updatedAt: new Date("2025-01-09T11:32:12.498Z"),
      },
      {
        id: 104,
        exerciseId: 32,
        weightInKg: 30,
        repetitions: 30,
        doneAt: new Date("2025-01-20T00:00:00.000Z"),
        createdAt: new Date("2025-01-09T11:32:12.498Z"),
        updatedAt: new Date("2025-01-09T11:32:12.498Z"),
      },
    ],
  },
];

export const exercisesFrequencyMock: Awaited<
  ReturnType<typeof selectExercisesFrequencyAction>
> = exercisesMock.map((exercise) => {
  return {
    name: exercise.name,
    frequency: exercise.sets.length,
    id: exercise.id,
  };
});

export const tagsFrequencyMock = exercisesMock.reduce<
  Awaited<ReturnType<typeof selectTagsFrequencyAction>>
>((tagsFrequency, exercise) => {
  const tags = exercise.tags.map((exericseTag) => exericseTag.tag);

  for (const tag of tags) {
    const tagFrequency = tagsFrequency.find((tagFrequency) => {
      return tagFrequency.id === tag.id;
    });

    if (!tagFrequency) {
      tagsFrequency.push({ name: tag.name, id: tag.id, frequency: 1 });
    } else {
      tagFrequency.frequency += 1;
    }
  }

  return tagsFrequency;
}, []);
