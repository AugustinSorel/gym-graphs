import { and, asc, desc, eq, inArray, sql, SQL } from "drizzle-orm";
import {
  dashboardTileTable,
  tagTable,
  userTable,
  setTable,
} from "~/db/db.schemas";
import { createExercises } from "~/exercise/exercise.services";
import { createSets } from "~/set/set.services";
import { addExerciseTags, createTags } from "~/tag/tag.services";
import { dashboardTileSchema } from "~/user/user.schemas";
import type { Db } from "~/libs/db";
import type { DashboardTile, User } from "~/db/db.schemas";
import { addDate } from "~/utils/date";

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
      tags: {
        orderBy: asc(tagTable.createdAt),
        with: {
          exercises: true,
        },
      },
    },
  });
};

export const selectDashboardTiles = async (
  userId: DashboardTile["userId"],
  page: number,
  pageSize: number,
  db: Db,
) => {
  return db.query.dashboardTileTable.findMany({
    where: eq(dashboardTileTable.userId, userId),
    orderBy: desc(dashboardTileTable.index),
    limit: pageSize,
    offset: (page - 1) * pageSize,
    with: {
      exercise: {
        with: {
          sets: {
            orderBy: desc(setTable.createdAt),
          },
          tags: {
            orderBy: asc(tagTable.createdAt),
            with: {
              tag: true,
            },
          },
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

export const insertDashboardTile = async (
  type: DashboardTile["type"],
  exerciseId: DashboardTile["exerciseId"],
  userId: DashboardTile["userId"],
  db: Db,
) => {
  return db.insert(dashboardTileTable).values({ type, userId, exerciseId });
};

export const reorderDashboardTiles = async (
  tileIds: Array<DashboardTile["id"]>,
  userId: DashboardTile["userId"],
  db: Db,
) => {
  const sqlChunks: Array<SQL> = [];

  sqlChunks.push(sql`(case`);

  tileIds.forEach((tileId, i) => {
    sqlChunks.push(
      sql`when ${dashboardTileTable.id} = ${tileId} then cast(${i} as integer)`,
    );
  });

  sqlChunks.push(sql`end)`);

  const finalSql = sql.join(sqlChunks, sql.raw(" "));

  await db
    .update(dashboardTileTable)
    .set({ index: finalSql })
    .where(
      and(
        inArray(dashboardTileTable.id, tileIds),
        eq(dashboardTileTable.userId, userId),
      ),
    );
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

  const [tags, [benchPress, squat, deadlift]] = await Promise.all([
    createTags(
      tagsName.map((name) => ({ name, userId })),
      db,
    ),
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
    insertDashboardTiles(
      [
        {
          type: dashboardTileSchema.shape.type.enum.exercisesFrequency,
          userId,
        },
        { type: dashboardTileSchema.shape.type.enum.tagsFrequency, userId },
        { type: dashboardTileSchema.shape.type.enum.exercisesFunFacts, userId },
        { type: dashboardTileSchema.shape.type.enum.setsHeatMap, userId },
        {
          type: dashboardTileSchema.shape.type.enum.exercise,
          exerciseId: benchPress.id,
          userId,
        },
        {
          type: dashboardTileSchema.shape.type.enum.exercise,
          exerciseId: squat.id,
          userId,
        },
        {
          type: dashboardTileSchema.shape.type.enum.exercise,
          exerciseId: deadlift.id,
          userId,
        },
      ],
      db,
    ),
  ];

  await Promise.all(operations);
};
