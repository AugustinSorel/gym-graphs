import { tagRepo } from "@gym-graphs/db/repo/tag";
import { dashboardRepo } from "@gym-graphs/db/repo/dashboard";
import { exerciseRepo } from "@gym-graphs/db/repo/exercise";
import { tileRepo } from "@gym-graphs/db/repo/tile";
import { setRepo } from "@gym-graphs/db/repo/set";
import { addDate } from "~/utils/dates";
import { dbErrorToHttp } from "~/libs/db";
import type { User } from "@gym-graphs/db/schemas";
import type { Db } from "@gym-graphs/db";

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
    tagRepo
      .createMany(
        data.tags.map((name) => ({ name, userId })),
        db,
      )
      .match((tags) => tags, dbErrorToHttp),
    dashboardRepo
      .create(userId, db)
      .match((dashboard) => dashboard, dbErrorToHttp),
    exerciseRepo
      .createMany(
        data.exercisesName.map(() => ({})),
        db,
      )
      .match((exercise) => exercise, dbErrorToHttp),
  ]);

  if (!benchPress || !squat || !deadlift) {
    throw new Error("benchPress, squat, deadlift not returned by db");
  }

  const [
    exerciseTagCountTile,
    exerciseSetCountTile,
    dashboardHeatMapTile,
    dashboardFunFactsTile,
    benchPressTile,
    squatTile,
    deadliftTile,
  ] = await tileRepo
    .createMany(
      [
        {
          name: "tags frequency",
          dashboardId: dashboard.id,
        },
        {
          name: "exercises frequency",
          dashboardId: dashboard.id,
        },
        {
          name: "tiles fun facts",
          dashboardId: dashboard.id,
        },
        {
          name: "sets heat map",
          dashboardId: dashboard.id,
        },
        {
          name: data.exercisesName[0],
          dashboardId: dashboard.id,
        },
        {
          name: data.exercisesName[1],
          dashboardId: dashboard.id,
        },
        {
          name: data.exercisesName[2],
          dashboardId: dashboard.id,
        },
      ],
      db,
    )
    .match((tile) => tile, dbErrorToHttp);

  if (
    !benchPressTile ||
    !squatTile ||
    !deadliftTile ||
    !exerciseSetCountTile ||
    !exerciseTagCountTile ||
    !dashboardHeatMapTile ||
    !dashboardFunFactsTile
  ) {
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
    tileRepo.addExerciseOverviewTiles(
      [
        { exerciseId: benchPress.id, tileId: benchPressTile.id },
        { exerciseId: squat.id, tileId: squatTile.id },
        { exerciseId: deadlift.id, tileId: deadliftTile.id },
      ],
      db,
    ),
    tileRepo.addExerciseSetCount(exerciseSetCountTile.id, db),
    tileRepo.addExerciseTagCount(exerciseTagCountTile.id, db),
    tileRepo.addDashboardHeatMap(dashboardHeatMapTile.id, db),
    tileRepo.addDashboardFunFacts(dashboardFunFactsTile.id, db),
    tagRepo.addManyToTile(
      benchPressTile.id,
      tags.filter((tag) => ["chest"].includes(tag.name)).map((tag) => tag.id),
      db,
    ),
    tagRepo.addManyToTile(
      squatTile.id,
      tags.filter((tag) => ["legs"].includes(tag.name)).map((tag) => tag.id),
      db,
    ),
    tagRepo.addManyToTile(
      deadliftTile.id,
      tags
        .filter((tag) => ["legs", "calfs"].includes(tag.name))
        .map((tag) => tag.id),
      db,
    ),
  ];
  await Promise.all(operations);
};
