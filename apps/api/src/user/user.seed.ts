import type { User } from "~/db/db.schemas";

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
};

export const seedUserAccount = async (userId: User["id"]) => {
  //TODO: this
  // const [tags, dashboard, [benchPress, squat, deadlift]] =
  //   await Promise.all([
  //     createTags(
  //       tagsName.map((name) => ({ name, userId })),
  //       db,
  //     ),
  //     createDashboard(userId, db),
  //     createExercises(
  //       exercisesName.map(() => ({})),
  //       db,
  //     ),
  //   ]);
  // if (!benchPress || !squat || !deadlift) {
  //   throw new ExerciseNotFoundError();
  // }
  // const [
  //   _tilesToTagsCountTile,
  //   _tilesToSetsCountTile,
  //   _tilesFunFactsTile,
  //   _tilesSetsHeatMapTile,
  //   benchPressTile,
  //   squatTile,
  //   deadliftTile,
  // ] = await createTiles(
  //   [
  //     {
  //       name: "tags frequency",
  //       type: tileSchema.shape.type.enum.tilesToTagsCount,
  //       dashboardId: dashboard.id,
  //     },
  //     {
  //       name: "exercises frequency",
  //       type: tileSchema.shape.type.enum.tilesToSetsCount,
  //       dashboardId: dashboard.id,
  //     },
  //     {
  //       name: "tiles fun facts",
  //       type: tileSchema.shape.type.enum.tilesFunFacts,
  //       dashboardId: dashboard.id,
  //     },
  //     {
  //       name: "sets heat map",
  //       type: tileSchema.shape.type.enum.tilesSetsHeatMap,
  //       dashboardId: dashboard.id,
  //     },
  //     {
  //       name: exercisesName[0],
  //       type: tileSchema.shape.type.enum.exercise,
  //       exerciseId: benchPress.id,
  //       dashboardId: dashboard.id,
  //     },
  //     {
  //       name: exercisesName[1],
  //       type: tileSchema.shape.type.enum.exercise,
  //       exerciseId: squat.id,
  //       dashboardId: dashboard.id,
  //     },
  //     {
  //       name: exercisesName[2],
  //       type: tileSchema.shape.type.enum.exercise,
  //       exerciseId: deadlift.id,
  //       dashboardId: dashboard.id,
  //     },
  //   ],
  //   db,
  // );
  // if (!benchPressTile || !squatTile || !deadliftTile) {
  //   throw new TileNotFoundError();
  // }
  // const operations = [
  //   createSets(
  //     [
  //       ...sets.benchPress.map((set, i) => ({
  //         weightInKg: set,
  //         repetitions: set,
  //         exerciseId: benchPress.id,
  //         doneAt: addDate(new Date(), ++i * -1),
  //       })),
  //       ...sets.benchPress.slice(0, 3).map((set, i) => ({
  //         weightInKg: set,
  //         repetitions: set - ++i,
  //         exerciseId: benchPress.id,
  //         doneAt: addDate(new Date(), ++i * -1),
  //       })),
  //       ...sets.squat.map((set, i) => ({
  //         weightInKg: set,
  //         repetitions: set,
  //         exerciseId: squat.id,
  //         doneAt: addDate(new Date(), ++i * -1),
  //       })),
  //       ...sets.squat.slice(1, 4).map((set, i) => ({
  //         weightInKg: set,
  //         repetitions: set - ++i * 3,
  //         exerciseId: squat.id,
  //         doneAt: addDate(new Date(), ++i * -1),
  //       })),
  //       ...sets.deadlift.map((set, i) => ({
  //         weightInKg: set,
  //         repetitions: set,
  //         exerciseId: deadlift.id,
  //         doneAt: addDate(new Date(), ++i * -1),
  //       })),
  //       ...sets.deadlift.slice(1, 3).map((set, i) => ({
  //         weightInKg: set,
  //         repetitions: set - ++i * 4,
  //         exerciseId: deadlift.id,
  //         doneAt: addDate(new Date(), ++i * -1),
  //       })),
  //     ],
  //     db,
  //   ),
  //   addTagsToTile(
  //     benchPressTile.id,
  //     tags
  //       .filter((tag) => ["chest"].includes(tag.name))
  //       .map((tag) => tag.id),
  //     db,
  //   ),
  //   addTagsToTile(
  //     squatTile.id,
  //     tags
  //       .filter((tag) => ["legs"].includes(tag.name))
  //       .map((tag) => tag.id),
  //     db,
  //   ),
  //   addTagsToTile(
  //     deadliftTile.id,
  //     tags
  //       .filter((tag) => ["legs", "calfs"].includes(tag.name))
  //       .map((tag) => tag.id),
  //     db,
  //   ),
  // ];
  // await Promise.all(operations);
};
