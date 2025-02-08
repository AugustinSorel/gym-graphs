import { asc, count, desc, eq, sql } from "drizzle-orm";
import { exerciseTable, setTable, tagTable, userTable } from "~/db/db.schemas";
import { createExercises } from "~/exercise/exercise.services";
import { createSets } from "~/set/set.services";
import { addExerciseTags, createTags } from "~/tag/tag.services";
import { tileSchema } from "~/dashboard/dashboard.schemas";
import { addDate } from "~/utils/date";
import { insertDashboard, insertTiles } from "~/dashboard/dashboard.services";
import type { Db } from "~/libs/db";
import type { Exercise, User } from "~/db/db.schemas";

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
      dashboard: {
        columns: {
          id: true,
        },
      },
      tags: {
        orderBy: asc(tagTable.createdAt),
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

export const seedUserAccount = async (userId: User["id"], db: Db) => {
  const exercisesName = ["bench press", "squat", "deadlift"] as const;

  const tagsName = [
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

  const sets = {
    benchPress: [10, 20, 10, 30] as const,
    squat: [20, 10, 30, 10] as const,
    deadlift: [30, 10, 20, 30] as const,
  } as const;

  const [tags, dashboard, [benchPress, squat, deadlift]] = await Promise.all([
    createTags(
      tagsName.map((name) => ({ name, userId })),
      db,
    ),
    insertDashboard(userId, db),
    createExercises(
      exercisesName.map((name) => ({ name, userId })),
      db,
    ),
  ]);

  if (!benchPress || !squat || !deadlift) {
    throw new Error("exercises returned by db are null");
  }

  const operations = [
    createSets(
      [
        ...sets.benchPress.map((set, i) => ({
          weightInKg: set,
          repetitions: set,
          exerciseId: benchPress.id,
          doneAt: addDate(new Date(), i * -1),
        })),
        ...sets.squat.map((set, i) => ({
          weightInKg: set,
          repetitions: set,
          exerciseId: squat.id,
          doneAt: addDate(new Date(), i * -1),
        })),
        ...sets.deadlift.map((set, i) => ({
          weightInKg: set,
          repetitions: set,
          exerciseId: deadlift.id,
          doneAt: addDate(new Date(), i * -1),
        })),
      ],
      db,
    ),
    addExerciseTags(
      userId,
      benchPress.id,
      tags.filter((tag) => ["chest"].includes(tag.name)).map((tag) => tag.id),
      db,
    ),
    addExerciseTags(
      userId,
      squat.id,
      tags.filter((tag) => ["legs"].includes(tag.name)).map((tag) => tag.id),
      db,
    ),
    addExerciseTags(
      userId,
      deadlift.id,
      tags
        .filter((tag) => ["legs", "calfs"].includes(tag.name))
        .map((tag) => tag.id),
      db,
    ),
    insertTiles(
      [
        {
          type: tileSchema.shape.type.enum.exercisesFrequency,
          dashboardId: dashboard.id,
        },
        {
          type: tileSchema.shape.type.enum.tagsFrequency,
          dashboardId: dashboard.id,
        },
        {
          type: tileSchema.shape.type.enum.exercisesFunFacts,
          dashboardId: dashboard.id,
        },
        {
          type: tileSchema.shape.type.enum.setsHeatMap,
          dashboardId: dashboard.id,
        },
        {
          type: tileSchema.shape.type.enum.exercise,
          exerciseId: benchPress.id,
          dashboardId: dashboard.id,
        },
        {
          type: tileSchema.shape.type.enum.exercise,
          exerciseId: squat.id,
          dashboardId: dashboard.id,
        },
        {
          type: tileSchema.shape.type.enum.exercise,
          exerciseId: deadlift.id,
          dashboardId: dashboard.id,
        },
      ],
      db,
    ),
  ];

  await Promise.all(operations);
};

export const selectUserTotalWeightInKg = async (
  userId: Exercise["id"],
  db: Db,
) => {
  const [res] = await db
    .select({
      total: sql`sum(${setTable.weightInKg} * ${setTable.repetitions})`.mapWith(
        Number,
      ),
    })
    .from(exerciseTable)
    .innerJoin(setTable, eq(setTable.exerciseId, exerciseTable.id))
    .where(eq(exerciseTable.userId, userId));

  if (!res) {
    throw new Error("total weight in kg returned by db is null");
  }

  return res;
};

export const selectUserSetsCount = async (userId: Exercise["id"], db: Db) => {
  const [setsCount] = await db
    .select({
      count: count(setTable.id).mapWith(Number),
    })
    .from(exerciseTable)
    .innerJoin(setTable, eq(setTable.exerciseId, exerciseTable.id))
    .where(eq(exerciseTable.userId, userId));

  if (!setsCount) {
    throw new Error("sets count returned by db is null");
  }

  return setsCount;
};

export const selectUserFavoriteExercise = async (
  userId: Exercise["userId"],
  db: Db,
) => {
  const [favoriteExercise] = await db
    .select({
      name: exerciseTable.name,
      setsCount: count(setTable.id).mapWith(Number),
    })
    .from(exerciseTable)
    .innerJoin(setTable, eq(setTable.exerciseId, exerciseTable.id))
    .where(eq(exerciseTable.userId, userId))
    .groupBy(exerciseTable.id)
    .orderBy(desc(sql`count`))
    .limit(1);

  if (!favoriteExercise) {
    throw new Error("favorite exercise returned by db is null");
  }

  return favoriteExercise;
};

export const selectUserLeastFavoriteExercise = async (
  userId: Exercise["userId"],
  db: Db,
) => {
  const [leastFavoriteExercise] = await db
    .select({
      name: exerciseTable.name,
      setsCount: count(setTable.id).mapWith(Number),
    })
    .from(exerciseTable)
    .innerJoin(setTable, eq(setTable.exerciseId, exerciseTable.id))
    .where(eq(exerciseTable.userId, userId))
    .groupBy(exerciseTable.id)
    .orderBy(asc(sql`count`))
    .limit(1);

  if (!leastFavoriteExercise) {
    throw new Error("least favorite exercise returned by db is null");
  }

  return leastFavoriteExercise;
};
