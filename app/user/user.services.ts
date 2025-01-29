import { asc, eq } from "drizzle-orm";
import { dashboardTileTable, tagTable, userTable } from "~/db/db.schemas";
import { createExercises } from "~/exercise/exercise.services";
import { createSets } from "~/set/set.services";
import { addExerciseTags, createTags } from "~/tag/tag.services";
import { dashboardTileSchema } from "~/user/user.schemas";
import type { Db } from "~/libs/db.lib";
import type { DashboardTile, Exercise, User } from "~/db/db.schemas";

export const createUserWithEmailAndPassword = async (
  email: User["email"],
  password: NonNullable<User["password"]>,
  name: User["name"],
  db: Db,
) => {
  const [user] = await db
    .insert(userTable)
    .values({ email, password, name })
    .returning();

  if (!user) {
    throw new Error("user returned by db is null");
  }

  return user;
};

export const createUserWithEmailOnly = async (
  email: User["email"],
  name: User["name"],
  db: Db,
) => {
  const [user] = await db
    .insert(userTable)
    .values({
      email,
      name,
      emailVerifiedAt: new Date(),
    })
    .returning();

  if (!user) {
    throw new Error("user returned by db is null");
  }

  return user;
};

export const selectUserByEmail = async (email: User["email"], db: Db) => {
  return db.query.userTable.findFirst({
    where: eq(userTable.email, email),
  });
};

export const selectClientUser = async (userId: User["id"], db: Db) => {
  return db.query.userTable.findFirst({
    where: eq(userTable.id, userId),
    columns: {
      id: true,
      email: true,
      weightUnit: true,
      name: true,
      oneRepMaxAlgo: true,
    },
    with: {
      dashboardTiles: {
        orderBy: [asc(dashboardTileTable.index)],
      },
      tags: {
        orderBy: [asc(tagTable.createdAt)],
        with: {
          exercises: true,
        },
      },
    },
  });
};

export const renameUser = async (
  name: User["name"],
  userId: User["id"],
  db: Db,
) => {
  await db
    .update(userTable)
    .set({ name, updatedAt: new Date() })
    .where(eq(userTable.id, userId));
};

export const updateWeightUnit = async (
  weightUnit: User["weightUnit"],
  userId: User["id"],
  db: Db,
) => {
  await db
    .update(userTable)
    .set({ weightUnit, updatedAt: new Date() })
    .where(eq(userTable.id, userId));
};

export const updateOneRepMaxAlgo = async (
  oneRepMaxAlgo: User["oneRepMaxAlgo"],
  userId: User["id"],
  db: Db,
) => {
  await db
    .update(userTable)
    .set({ oneRepMaxAlgo, updatedAt: new Date() })
    .where(eq(userTable.id, userId));
};

export const updateEmailVerifiedAt = async (userId: User["id"], db: Db) => {
  const [user] = await db
    .update(userTable)
    .set({
      emailVerifiedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(userTable.id, userId))
    .returning();

  if (!user) {
    throw new Error("user returned by db is null");
  }

  return user;
};

export const updatePassword = async (
  password: NonNullable<User["password"]>,
  db: Db,
) => {
  return await db.update(userTable).set({
    password,
    updatedAt: new Date(),
  });
};

export const deleteUser = async (userId: User["id"], db: Db) => {
  await db.delete(userTable).where(eq(userTable.id, userId));
};

export const insertDashboardTiles = async (
  values: Array<typeof dashboardTileTable.$inferInsert>,
  db: Db,
) => {
  return db.insert(dashboardTileTable).values(values);
};

export const deleteDashboardTiles = async (
  userId: DashboardTile["userId"],
  db: Db,
) => {
  return db
    .delete(dashboardTileTable)
    .where(eq(dashboardTileTable.userId, userId));
};

export const seedUserAccount = async (userId: User["id"], db: Db) => {
  const defaultExercises = ["bench press", "squat", "deadlift"] as const;

  const defaultTags = [
    "legs",
    "chest",
    "biceps",
    "triceps",
    "back",
    "shoulders",
    "calfs",
    "abs",
    "traps",
  ] as const;

  const exerciseTagMapping = new Map([
    ["bench press", ["chest"]],
    ["squat", ["legs"]],
    ["deadlift", ["legs", "calfs"]],
  ]);

  const [exercises, tags] = await Promise.all([
    createExercises(
      defaultExercises.map((name) => ({ name, userId })),
      db,
    ),
    createTags(
      defaultTags.map((name) => ({ name, userId })),
      db,
    ),
  ]);

  const dashboardTiles = [
    ...exercises.map((e) => ({
      type: dashboardTileSchema.shape.type.enum.exercise,
      userId,
      exerciseId: e.id,
    })),
    { type: dashboardTileSchema.shape.type.enum.exercisesFrequency, userId },
    { type: dashboardTileSchema.shape.type.enum.tagsFrequency, userId },
    { type: dashboardTileSchema.shape.type.enum.exercisesFunFacts, userId },
    { type: dashboardTileSchema.shape.type.enum.setsHeatMap, userId },
  ];

  const getTagIdsForExercise = (exerciseName: Exercise["name"]) => {
    const tagNames = exerciseTagMapping.get(exerciseName);

    if (!tagNames) {
      throw new Error(`No tag mapping found for exercise: ${exerciseName}`);
    }

    return tagNames.map((tagName) => {
      const tagId = tags.find((tag) => tag.name === tagName)?.id;

      if (!tagId) {
        throw new Error(`Tag ID not found for tag name: ${tagName}`);
      }

      return tagId;
    });
  };

  const getSetsForExercise = (exerciseId: number) => {
    const sets = [...Array(6).keys()].map((i) => {
      const values = [10, 20, 30, 40];

      const randomIndex = Math.floor(Math.random() * values.length);
      const randomValue = values.at(randomIndex);

      if (!randomValue) {
        throw new Error("random values is undefined");
      }

      return {
        exerciseId,
        repetitions: randomValue,
        weightInKg: randomValue,
        doneAt: new Date(new Date().setDate(new Date().getDate() - i)),
      };
    });

    return sets;
  };

  const exerciseOperations = exercises.flatMap((exercise) => [
    addExerciseTags(
      userId,
      exercise.id,
      getTagIdsForExercise(exercise.name),
      db,
    ),
    createSets(getSetsForExercise(exercise.id), db),
  ]);

  await Promise.all([
    ...exerciseOperations,
    insertDashboardTiles(dashboardTiles, db),
  ]);
};
