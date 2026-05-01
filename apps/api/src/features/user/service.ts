import { DateTime, Duration, Effect } from "effect";
import { UserRepo } from "../user/repo";
import type { User } from "@gym-graphs/shared/user/schemas";
import type { PatchUserByIdPayload } from "@gym-graphs/shared/user/schemas";
import { TagRepo } from "../tag/repo";
import { ExerciseRepo } from "../exercise/repo";
import { SetRepo } from "../set/repo";
import { withTransaction } from "#/integrations/db/db";

export class UserService extends Effect.Service<UserService>()("UserService", {
  accessors: true,
  dependencies: [UserRepo.Default],
  effect: Effect.gen(function* () {
    const userRepo = yield* UserRepo;

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

      //FIXME
      exportDataByUserId: (userId: User["id"]) => {
        return Effect.gen(function* () {
          const user = yield* userRepo.selectById(userId);

          return {
            user,
            exercises: [],
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
    dependencies: [TagRepo.Default, ExerciseRepo.Default, SetRepo.Default],
    effect: Effect.gen(function* () {
      const tagRepo = yield* TagRepo;
      const exerciseRepo = yield* ExerciseRepo;
      const setRepo = yield* SetRepo;

      return {
        seed: (userId: User["id"]) =>
          withTransaction(
            Effect.gen(function* () {
              const [tags, exercises] = yield* Effect.all(
                [
                  tagRepo.createMany(
                    seedData.tags.map((name) => ({ name, userId })),
                  ),
                  exerciseRepo.createMany(
                    seedData.exercises.map((exercise) => ({
                      name: exercise.name,
                      userId,
                    })),
                  ),
                ],
                { concurrency: "unbounded" },
              );

              yield* Effect.forEach(
                exercises,
                (exercise) => {
                  const mockExercise = seedData.exercises.find((ex) => {
                    return ex.name === exercise.name;
                  });

                  if (!mockExercise) {
                    return Effect.void;
                  }

                  const mockSets = mockExercise.sets.map(
                    ({ weightInMg, repetitions, daysAgo }) => ({
                      weightInMg,
                      repetitions,
                      exerciseId: exercise.id,
                      doneAt: nDaysAgo(daysAgo),
                    }),
                  );

                  const tagIds = tags
                    .filter((tag) => mockExercise.tags.includes(tag.name))
                    .map((tag) => tag.id);

                  return Effect.all(
                    [
                      exerciseRepo.addTags(exercise.id, tagIds),
                      setRepo.createMany(mockSets),
                    ],
                    { concurrency: "unbounded" },
                  );
                },
                { concurrency: "unbounded" },
              );
            }),
          ),
      };
    }),
  },
) {}

type SeedSet = { weightInMg: number; repetitions: number; daysAgo: number };

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
      sets: [
        { weightInMg: 10_000_000, repetitions: 10, daysAgo: 1 },
        { weightInMg: 20_000_000, repetitions: 20, daysAgo: 2 },
        { weightInMg: 10_000_000, repetitions: 10, daysAgo: 3 },
        { weightInMg: 30_000_000, repetitions: 30, daysAgo: 4 },
        { weightInMg: 10_000_000, repetitions: 9, daysAgo: 1 },
        { weightInMg: 20_000_000, repetitions: 18, daysAgo: 2 },
        { weightInMg: 10_000_000, repetitions: 7, daysAgo: 3 },
      ] satisfies SeedSet[],
    },
    {
      name: "squat",
      tags: ["legs"],
      sets: [
        { weightInMg: 20_000_000, repetitions: 20, daysAgo: 1 },
        { weightInMg: 10_000_000, repetitions: 10, daysAgo: 2 },
        { weightInMg: 30_000_000, repetitions: 30, daysAgo: 3 },
        { weightInMg: 10_000_000, repetitions: 10, daysAgo: 4 },
        { weightInMg: 10_000_000, repetitions: 7, daysAgo: 1 },
        { weightInMg: 30_000_000, repetitions: 24, daysAgo: 2 },
        { weightInMg: 10_000_000, repetitions: 1, daysAgo: 3 },
      ] satisfies SeedSet[],
    },
    {
      name: "deadlift",
      tags: ["legs", "calfs"],
      sets: [
        { weightInMg: 30_000_000, repetitions: 30, daysAgo: 1 },
        { weightInMg: 10_000_000, repetitions: 10, daysAgo: 2 },
        { weightInMg: 20_000_000, repetitions: 20, daysAgo: 3 },
        { weightInMg: 30_000_000, repetitions: 30, daysAgo: 4 },
        { weightInMg: 10_000_000, repetitions: 6, daysAgo: 1 },
        { weightInMg: 20_000_000, repetitions: 12, daysAgo: 2 },
      ] satisfies SeedSet[],
    },
  ],
};

const nDaysAgo = (days: number): Date =>
  DateTime.toDate(
    DateTime.subtractDuration(DateTime.unsafeNow(), Duration.days(days)),
  );
