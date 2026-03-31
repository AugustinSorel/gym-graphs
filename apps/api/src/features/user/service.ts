import { Array, DateTime, Duration, Effect } from "effect";
import { UserRepo } from "../user/repo";
import { DashboardTileRepo } from "../dashboard-tile/repo";
import type { User, Exercise } from "#/integrations/db/schema";
import type { PatchUserByIdPayload } from "@gym-graphs/shared/user/schemas";
import { TagRepo } from "../tag/repo";
import { ExerciseRepo } from "../exercise/repo";
import { SetRepo } from "../set/repo";
import { withTransaction } from "#/integrations/db/db";

export class UserService extends Effect.Service<UserService>()("UserService", {
  accessors: true,
  dependencies: [UserRepo.Default, DashboardTileRepo.Default],
  effect: Effect.gen(function* () {
    const userRepo = yield* UserRepo;
    const dashboardTileRepo = yield* DashboardTileRepo;

    return {
      patchByUserId: (
        payload: typeof PatchUserByIdPayload.Type,
        userId: User["id"],
      ) => {
        return Effect.gen(function* () {
          const user = yield* userRepo.patchByUserId(payload, userId);

          return user;
        }).pipe(Effect.timeout(5000));
      },

      deleteByUserId: (userId: User["id"]) => {
        return Effect.gen(function* () {
          yield* userRepo.deleteByUserId(userId);
        }).pipe(Effect.timeout(5000));
      },

      exportDataByUserId: (userId: User["id"]) => {
        return Effect.gen(function* () {
          const [user, tiles] = yield* Effect.all(
            [
              userRepo.selectById(userId),
              dashboardTileRepo.selectAll(userId, Number.MAX_SAFE_INTEGER, {}),
            ],
            { concurrency: "unbounded" },
          );

          const exercises = tiles
            .filter((tile) => {
              return tile.type === "exercise" && tile.exercise !== null;
            })
            .map((tile) => {
              return {
                id: tile.exercise!.id,
                name: tile.name,
                tags: tile.tags.map((t) => t.tag.name),
                sets: tile.exercise!.sets,
              };
            });

          return {
            user,
            exercises,
          };
        }).pipe(Effect.timeout(10000));
      },
    };
  }),
}) {}

export class SeedUserService extends Effect.Service<SeedUserService>()(
  "SeedUserService",
  {
    accessors: true,
    dependencies: [
      TagRepo.Default,
      ExerciseRepo.Default,
      DashboardTileRepo.Default,
      SetRepo.Default,
    ],
    effect: Effect.gen(function* () {
      const tagRepo = yield* TagRepo;
      const exerciseRepo = yield* ExerciseRepo;
      const dashboardTileRepo = yield* DashboardTileRepo;
      const setRepo = yield* SetRepo;

      const seedExercise = (
        exercise: (typeof seedData.exercises)[number],
        exerciseId: Exercise["id"],
        tileId: number,
        tagIds: number[],
      ) =>
        Effect.all(
          [
            dashboardTileRepo
              .addTags(tileId, tagIds)
              .pipe(Effect.when(() => Array.isNonEmptyArray(tagIds))),
            setRepo.createMany(buildSets(exercise.sets, exerciseId)),
          ],
          { concurrency: "unbounded" },
        );

      return {
        seed: (userId: User["id"]) =>
          withTransaction(
            Effect.gen(function* () {
              const [tags, exercises] = yield* Effect.all(
                [
                  tagRepo.createMany(
                    seedData.tags.map((name) => ({ name, userId })),
                  ),
                  exerciseRepo.createMany(seedData.exercises.map(() => ({}))),
                ],
                { concurrency: "unbounded" },
              );

              const tiles = yield* dashboardTileRepo.createMany([
                {
                  name: "exercises frequency",
                  type: "exerciseSetCount" as const,
                  userId,
                  exerciseId: null,
                },
                {
                  name: "tags frequency",
                  type: "exerciseTagCount" as const,
                  userId,
                  exerciseId: null,
                },
                {
                  name: "heat map",
                  type: "dashboardHeatMap" as const,
                  userId,
                  exerciseId: null,
                },
                {
                  name: "fun facts",
                  type: "dashboardFunFacts" as const,
                  userId,
                  exerciseId: null,
                },
                ...seedData.exercises.map((exercise, i) => ({
                  name: exercise.name,
                  type: "exercise" as const,
                  userId,
                  exerciseId: exercises.at(i)?.id,
                })),
              ]);

              yield* Effect.forEach(
                seedData.exercises,
                (exercise, i) =>
                  seedExercise(
                    exercise,
                    exercises[i]!.id,
                    tiles[i]!.id,
                    tags
                      .filter((tag) =>
                        exercise.tags.some((t) => t === tag.name),
                      )
                      .map((tag) => tag.id),
                  ),
                { concurrency: "unbounded" },
              );
            }),
          ),
      };
    }),
  },
) {}

const seedData = {
  tags: [
    "legs",
    "chest",
    "biceps",
    "triceps",
    "back",
    "shoulders",
    "calfs",
    "abs",
    "traps",
  ],
  exercises: [
    {
      name: "bench press",
      tags: ["chest"],
      sets: {
        primary: [10, 20, 10, 30],
        secondary: { slice: [0, 3] as const, repOffset: (i: number) => i + 1 },
      },
    },
    {
      name: "squat",
      tags: ["legs"],
      sets: {
        primary: [20, 10, 30, 10],
        secondary: {
          slice: [1, 4] as const,
          repOffset: (i: number) => (i + 1) * 3,
        },
      },
    },
    {
      name: "deadlift",
      tags: ["legs", "calfs"],
      sets: {
        primary: [30, 10, 20, 30],
        secondary: {
          slice: [1, 3] as const,
          repOffset: (i: number) => (i + 1) * 4,
        },
      },
    },
  ],
} as const;

type ExerciseSets = (typeof seedData.exercises)[number]["sets"];

const buildSets = (sets: ExerciseSets, exerciseId: Exercise["id"]) => [
  ...sets.primary.map((weight, i) => ({
    weightInKg: weight,
    repetitions: weight,
    exerciseId,
    doneAt: daysAgo(i + 1),
  })),
  ...sets.primary.slice(...sets.secondary.slice).map((weight, i) => ({
    weightInKg: weight,
    repetitions: weight - sets.secondary.repOffset(i),
    exerciseId,
    doneAt: daysAgo(i + 1),
  })),
];

const daysAgo = (days: number): Date =>
  DateTime.toDate(
    DateTime.subtractDuration(DateTime.unsafeNow(), Duration.days(days)),
  );
