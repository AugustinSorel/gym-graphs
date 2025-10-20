import { tagRepo } from "../tag/tag.repo";
import { dashboardRepo } from "~/domains/dashboard/dashboard.repo";
import { exerciseRepo } from "~/domains/exercise/exercise.repo";
import { tileRepo } from "~/domains/tile/tile.repo";
import { tileSchema } from "@gym-graphs/schemas/tile";
import { setRepo } from "~/domains/set/set.repo";
import { addDate } from "~/utils/dates";
import type { User } from "~/db/db.schemas";
import type { Db } from "~/libs/db";

const data = {
  exercisesName: ["bench press", "squat", "deadlift"],
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
  sets: {
    benchPress: [10, 20, 10, 30],
    squat: [20, 10, 30, 10],
    deadlift: [30, 10, 20, 30],
  },
} as const;

export const seedUserAccount = async (userId: User["id"], db: Db) => {
  const [tags, dashboard, [benchPress, squat, deadlift]] = await Promise.all([
    tagRepo.createMany(
      data.tags.map((name) => ({ name, userId })),
      db,
    ),
    dashboardRepo.create(userId, db),
    exerciseRepo.createMany(
      data.exercisesName.map(() => ({})),
      db,
    ),
  ]);

  if (!benchPress || !squat || !deadlift) {
    throw new Error("benchPress, squat, deadlift not returned by db");
  }

  const [
    _tilesToTagsCountTile,
    _tilesToSetsCountTile,
    _tilesFunFactsTile,
    _tilesSetsHeatMapTile,
    benchPressTile,
    squatTile,
    deadliftTile,
  ] = await tileRepo.createMany(
    [
      {
        name: "tags frequency",
        type: tileSchema.shape.type.enum.tilesToTagsCount,
        dashboardId: dashboard.id,
      },
      {
        name: "exercises frequency",
        type: tileSchema.shape.type.enum.tilesToSetsCount,
        dashboardId: dashboard.id,
      },
      {
        name: "tiles fun facts",
        type: tileSchema.shape.type.enum.tilesFunFacts,
        dashboardId: dashboard.id,
      },
      {
        name: "sets heat map",
        type: tileSchema.shape.type.enum.tilesSetsHeatMap,
        dashboardId: dashboard.id,
      },
      {
        name: data.exercisesName[0],
        type: tileSchema.shape.type.enum.exercise,
        exerciseId: benchPress.id,
        dashboardId: dashboard.id,
      },
      {
        name: data.exercisesName[1],
        type: tileSchema.shape.type.enum.exercise,
        exerciseId: squat.id,
        dashboardId: dashboard.id,
      },
      {
        name: data.exercisesName[2],
        type: tileSchema.shape.type.enum.exercise,
        exerciseId: deadlift.id,
        dashboardId: dashboard.id,
      },
    ],
    db,
  );

  if (!benchPressTile || !squatTile || !deadliftTile) {
    throw new Error(
      "benchPressTile, squatTile and deadliftTile not returned by db",
    );
  }

  const operations = [
    setRepo.createMany(
      [
        ...data.sets.benchPress.map((set, i) => ({
          weightInKg: set,
          repetitions: set,
          exerciseId: benchPress.id,
          doneAt: addDate(new Date(), ++i * -1),
        })),
        ...data.sets.benchPress.slice(0, 3).map((set, i) => ({
          weightInKg: set,
          repetitions: set - ++i,
          exerciseId: benchPress.id,
          doneAt: addDate(new Date(), ++i * -1),
        })),
        ...data.sets.squat.map((set, i) => ({
          weightInKg: set,
          repetitions: set,
          exerciseId: squat.id,
          doneAt: addDate(new Date(), ++i * -1),
        })),
        ...data.sets.squat.slice(1, 4).map((set, i) => ({
          weightInKg: set,
          repetitions: set - ++i * 3,
          exerciseId: squat.id,
          doneAt: addDate(new Date(), ++i * -1),
        })),
        ...data.sets.deadlift.map((set, i) => ({
          weightInKg: set,
          repetitions: set,
          exerciseId: deadlift.id,
          doneAt: addDate(new Date(), ++i * -1),
        })),
        ...data.sets.deadlift.slice(1, 3).map((set, i) => ({
          weightInKg: set,
          repetitions: set - ++i * 4,
          exerciseId: deadlift.id,
          doneAt: addDate(new Date(), ++i * -1),
        })),
      ],
      db,
    ),
    tileRepo.addTags(
      benchPressTile.id,
      tags.filter((tag) => ["chest"].includes(tag.name)).map((tag) => tag.id),
      db,
    ),
    tileRepo.addTags(
      squatTile.id,
      tags.filter((tag) => ["legs"].includes(tag.name)).map((tag) => tag.id),
      db,
    ),
    tileRepo.addTags(
      deadliftTile.id,
      tags
        .filter((tag) => ["legs", "calfs"].includes(tag.name))
        .map((tag) => tag.id),
      db,
    ),
  ];
  await Promise.all(operations);
};
