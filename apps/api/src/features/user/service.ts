import { Effect } from "effect";
import { UserRepo } from "../user/repo";
import type { User } from "#/integrations/db/schema";
import type { PatchUserByIdPayload } from "@gym-graphs/shared/user/schemas";
import { TagRepo } from "../tag/repo";
import { ExerciseRepo } from "../exercise/repo";
import { DashboardTileRepo } from "../dashboard-tile/repo";

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
    ],
    effect: Effect.gen(function* () {
      const tagRepo = yield* TagRepo;
      const exerciseRepo = yield* ExerciseRepo;
      const dashboardTileRepo = yield* DashboardTileRepo;

      return {
        seed: (userId: User["id"]) => {
          return Effect.gen(function* () {
            const tags = yield* tagRepo.createMany(
              Object.values(data.tags).map((name) => ({ name, userId })),
            );

            const exercises = yield* exerciseRepo.createMany(
              Object.values(data.tiles)
                .filter((tile) => tile.type === "exercise")
                .map(() => ({})),
            );

            const tiles = yield* dashboardTileRepo.createMany(
              Object.values(data.tiles).map((tile, i) => ({
                name: tile.name,
                type: tile.type,
                userId,
                exerciseId: exercises.at(i)?.id ?? null,
              })),
            );

            //FIXME:perf
            for (const tile of tiles) {
              const expectedTags =
                Object.values(data.tiles).find((t) => t.name === tile.name)
                  ?.tags ?? [];

              const tagIds = tags
                .filter((tag) => expectedTags.some((t) => t === tag.name))
                .map((tag) => tag.id);

              if (tagIds.length) {
                yield* dashboardTileRepo.addTags(tile.id, tagIds);
              }
            }
          });
        },
      };
    }),
  },
) {}

const data = {
  tags: {
    legs: "legs",
    chest: "chest",
    biceps: "biceps",
    triceps: "triceps",
    back: "back",
    shoulders: "shoulders",
    calfs: "calfs",
    abs: "abs",
    traps: "traps",
  },
  sets: {
    benchPress: [10, 20, 10, 30],
    squat: [20, 10, 30, 10],
    deadlift: [30, 10, 20, 30],
  },
  tiles: {
    benchPress: {
      name: "bench press",
      type: "exercise",
      tags: ["chest"],
    },
    squat: {
      name: "squat",
      type: "exercise",
      tags: ["legs"],
    },
    deadlift: {
      name: "deadlift",
      type: "exercise",
      tags: ["legs", "calfs"],
    },
  },
} as const;

// [cause]: error: insert or update on table "dashboard_tiles" violates foreign key constraint "dashboard_tiles_exercise_id_tag_id_fkey"
