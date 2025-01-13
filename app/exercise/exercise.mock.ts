import { selectDashboardExercises } from "./exercise.services";

export const exercisesMock = [
  {
    id: 30,
    userId: 7,
    name: "bench press",
    createdAt: new Date("2025-01-09T11:32:12.498Z"),
    updatedAt: new Date("2025-01-09T11:32:12.498Z"),
    tags: [],
    sets: [
      {
        id: 78,
        exerciseId: 30,
        weightInKg: 30,
        repetitions: 30,
        doneAt: new Date("2025-01-09T00:00:00.000Z"),
        createdAt: new Date("2025-01-09T11:32:12.498Z"),
        updatedAt: new Date("2025-01-09T11:32:12.498Z"),
      },
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
        doneAt: new Date("2025-01-07T00:00:00.000Z"),
        createdAt: new Date("2025-01-09T11:32:12.498Z"),
        updatedAt: new Date("2025-01-09T11:32:12.498Z"),
      },
      {
        id: 81,
        exerciseId: 30,
        weightInKg: 40,
        repetitions: 40,
        doneAt: new Date("2025-01-06T00:00:00.000Z"),
        createdAt: new Date("2025-01-09T11:32:12.498Z"),
        updatedAt: new Date("2025-01-09T11:32:12.498Z"),
      },
      {
        id: 82,
        exerciseId: 30,
        weightInKg: 30,
        repetitions: 30,
        doneAt: new Date("2025-01-05T00:00:00.000Z"),
        createdAt: new Date("2025-01-09T11:32:12.498Z"),
        updatedAt: new Date("2025-01-09T11:32:12.498Z"),
      },
      {
        id: 83,
        exerciseId: 30,
        weightInKg: 10,
        repetitions: 10,
        doneAt: new Date("2025-01-04T00:00:00.000Z"),
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
    tags: [],
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
        doneAt: new Date("2025-01-07T00:00:00.000Z"),
        createdAt: new Date("2025-01-09T11:32:12.498Z"),
        updatedAt: new Date("2025-01-09T11:32:12.498Z"),
      },
      {
        id: 87,
        exerciseId: 31,
        weightInKg: 20,
        repetitions: 20,
        doneAt: new Date("2025-01-06T00:00:00.000Z"),
        createdAt: new Date("2025-01-09T11:32:12.498Z"),
        updatedAt: new Date("2025-01-09T11:32:12.498Z"),
      },
      {
        id: 88,
        exerciseId: 31,
        weightInKg: 20,
        repetitions: 20,
        doneAt: new Date("2025-01-05T00:00:00.000Z"),
        createdAt: new Date("2025-01-09T11:32:12.498Z"),
        updatedAt: new Date("2025-01-09T11:32:12.498Z"),
      },
      {
        id: 89,
        exerciseId: 31,
        weightInKg: 10,
        repetitions: 10,
        doneAt: new Date("2025-01-04T00:00:00.000Z"),
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
    tags: [],
    sets: [
      {
        id: 90,
        exerciseId: 32,
        weightInKg: 30,
        repetitions: 30,
        doneAt: new Date("2025-01-09T00:00:00.000Z"),
        createdAt: new Date("2025-01-09T11:32:12.498Z"),
        updatedAt: new Date("2025-01-09T11:32:12.498Z"),
      },
      {
        id: 91,
        exerciseId: 32,
        weightInKg: 10,
        repetitions: 10,
        doneAt: new Date("2025-01-08T00:00:00.000Z"),
        createdAt: new Date("2025-01-09T11:32:12.498Z"),
        updatedAt: new Date("2025-01-09T11:32:12.498Z"),
      },
      {
        id: 92,
        exerciseId: 32,
        weightInKg: 40,
        repetitions: 40,
        doneAt: new Date("2025-01-07T00:00:00.000Z"),
        createdAt: new Date("2025-01-09T11:32:12.498Z"),
        updatedAt: new Date("2025-01-09T11:32:12.498Z"),
      },
      {
        id: 93,
        exerciseId: 32,
        weightInKg: 40,
        repetitions: 40,
        doneAt: new Date("2025-01-06T00:00:00.000Z"),
        createdAt: new Date("2025-01-09T11:32:12.498Z"),
        updatedAt: new Date("2025-01-09T11:32:12.498Z"),
      },
      {
        id: 94,
        exerciseId: 32,
        weightInKg: 10,
        repetitions: 10,
        doneAt: new Date("2025-01-05T00:00:00.000Z"),
        createdAt: new Date("2025-01-09T11:32:12.498Z"),
        updatedAt: new Date("2025-01-09T11:32:12.498Z"),
      },
      {
        id: 95,
        exerciseId: 32,
        weightInKg: 30,
        repetitions: 30,
        doneAt: new Date("2025-01-04T00:00:00.000Z"),
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
        id: 90,
        exerciseId: 32,
        weightInKg: 30,
        repetitions: 30,
        doneAt: new Date("2025-01-09T00:00:00.000Z"),
        createdAt: new Date("2025-01-09T11:32:12.498Z"),
        updatedAt: new Date("2025-01-09T11:32:12.498Z"),
      },
      {
        id: 91,
        exerciseId: 32,
        weightInKg: 50,
        repetitions: 30,
        doneAt: new Date("2025-01-08T00:00:00.000Z"),
        createdAt: new Date("2025-01-09T11:32:12.498Z"),
        updatedAt: new Date("2025-01-09T11:32:12.498Z"),
      },
      {
        id: 92,
        exerciseId: 32,
        weightInKg: 40,
        repetitions: 20,
        doneAt: new Date("2025-01-07T00:00:00.000Z"),
        createdAt: new Date("2025-01-09T11:32:12.498Z"),
        updatedAt: new Date("2025-01-09T11:32:12.498Z"),
      },
      {
        id: 93,
        exerciseId: 32,
        weightInKg: 40,
        repetitions: 40,
        doneAt: new Date("2025-01-06T00:00:00.000Z"),
        createdAt: new Date("2025-01-09T11:32:12.498Z"),
        updatedAt: new Date("2025-01-09T11:32:12.498Z"),
      },
      {
        id: 94,
        exerciseId: 32,
        weightInKg: 40,
        repetitions: 50,
        doneAt: new Date("2025-01-05T00:00:00.000Z"),
        createdAt: new Date("2025-01-09T11:32:12.498Z"),
        updatedAt: new Date("2025-01-09T11:32:12.498Z"),
      },
      {
        id: 95,
        exerciseId: 32,
        weightInKg: 30,
        repetitions: 30,
        doneAt: new Date("2025-01-04T00:00:00.000Z"),
        createdAt: new Date("2025-01-09T11:32:12.498Z"),
        updatedAt: new Date("2025-01-09T11:32:12.498Z"),
      },
    ],
  },
] as const satisfies Awaited<ReturnType<typeof selectDashboardExercises>>;
