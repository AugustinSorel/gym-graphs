import { asc, eq, sql } from "drizzle-orm";
import { tagTable, userTable } from "~/db/db.schemas";
import { createExercises } from "~/exercise/exercise.services";
import { createSets } from "~/set/set.services";
import { addTagsToTile, createTags } from "~/tag/tag.services";
import { tileSchema } from "~/dashboard/dashboard.schemas";
import { addDate } from "~/utils/date";
import { createDashboard, createTiles } from "~/dashboard/dashboard.services";
import { UserNotFoundError } from "~/user/user.errors";
import { AuthDuplicateEmail } from "~/auth/auth.errors";
import { ExerciseNotFoundError } from "~/exercise/exercise.errors";
import { TileNotFoundError } from "~/dashboard/dashboard.errors";
import type { Db } from "~/libs/db";
import type { User } from "~/db/db.schemas";

export const createUserWithEmailAndPassword = async (
  email: User["email"],
  password: NonNullable<User["password"]>,
  salt: NonNullable<User["salt"]>,
  name: User["name"],
  db: Db,
) => {
  try {
    const [user] = await db
      .insert(userTable)
      .values({ email, password, name, salt })
      .returning();

    if (!user) {
      throw new UserNotFoundError();
    }

    return user;
  } catch (e) {
    if (AuthDuplicateEmail.check(e)) {
      throw new AuthDuplicateEmail();
    }

    throw e;
  }
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
    throw new UserNotFoundError();
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
    extras: {
      teamNotificationCount: sql`
        (
          select count(*) from team_member
            inner join team_event_notification
              on
                team_event_notification.team_id=team_member.team_id
                  and
                team_event_notification.user_id=${userId}
          where
            team_member.user_id=${userId}
              and
            team_event_notification.read_at is null
        )`
        .mapWith(Number)
        .as("team_notification_count"),
    },
    with: {
      dashboard: {
        columns: {
          id: true,
        },
      },
      tags: {
        orderBy: asc(tagTable.createdAt),
      },
    },
  });
};

export const renameUser = async (
  name: User["name"],
  userId: User["id"],
  db: Db,
) => {
  const [user] = await db
    .update(userTable)
    .set({ name })
    .where(eq(userTable.id, userId))
    .returning();

  if (!user) {
    throw new UserNotFoundError();
  }

  return user;
};

export const updateWeightUnit = async (
  weightUnit: User["weightUnit"],
  userId: User["id"],
  db: Db,
) => {
  const [user] = await db
    .update(userTable)
    .set({ weightUnit })
    .where(eq(userTable.id, userId))
    .returning();

  if (!user) {
    throw new UserNotFoundError();
  }

  return user;
};

export const updateOneRepMaxAlgo = async (
  oneRepMaxAlgo: User["oneRepMaxAlgo"],
  userId: User["id"],
  db: Db,
) => {
  const [user] = await db
    .update(userTable)
    .set({ oneRepMaxAlgo })
    .where(eq(userTable.id, userId))
    .returning();

  if (!user) {
    throw new UserNotFoundError();
  }

  return user;
};

export const updateEmailVerifiedAt = async (userId: User["id"], db: Db) => {
  const [user] = await db
    .update(userTable)
    .set({ emailVerifiedAt: new Date() })
    .where(eq(userTable.id, userId))
    .returning();

  if (!user) {
    throw new UserNotFoundError();
  }

  return user;
};

export const updatePasswordAndSalt = async (
  password: NonNullable<User["password"]>,
  salt: NonNullable<User["salt"]>,
  userId: User["id"],
  db: Db,
) => {
  const [user] = await db
    .update(userTable)
    .set({ password, salt })
    .where(eq(userTable.id, userId))
    .returning();

  if (!user) {
    throw new UserNotFoundError();
  }

  return user;
};

export const deleteUser = async (userId: User["id"], db: Db) => {
  const [user] = await db
    .delete(userTable)
    .where(eq(userTable.id, userId))
    .returning();

  if (!user) {
    throw new UserNotFoundError();
  }

  return user;
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
    createDashboard(userId, db),
    createExercises(
      exercisesName.map(() => ({})),
      db,
    ),
  ]);

  if (!benchPress || !squat || !deadlift) {
    throw new ExerciseNotFoundError();
  }

  const [
    _tilesToTagsCountTile,
    _tilesToSetsCountTile,
    _tilesFunFactsTile,
    _tilesSetsHeatMapTile,
    benchPressTile,
    squatTile,
    deadliftTile,
  ] = await createTiles(
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
        name: exercisesName[0],
        type: tileSchema.shape.type.enum.exercise,
        exerciseId: benchPress.id,
        dashboardId: dashboard.id,
      },
      {
        name: exercisesName[1],
        type: tileSchema.shape.type.enum.exercise,
        exerciseId: squat.id,
        dashboardId: dashboard.id,
      },
      {
        name: exercisesName[2],
        type: tileSchema.shape.type.enum.exercise,
        exerciseId: deadlift.id,
        dashboardId: dashboard.id,
      },
    ],
    db,
  );

  if (!benchPressTile || !squatTile || !deadliftTile) {
    throw new TileNotFoundError();
  }

  const operations = [
    createSets(
      [
        ...sets.benchPress.map((set, i) => ({
          weightInKg: set,
          repetitions: set,
          exerciseId: benchPress.id,
          doneAt: addDate(new Date(), ++i * -1),
        })),
        ...sets.benchPress.slice(0, 3).map((set, i) => ({
          weightInKg: set,
          repetitions: set - ++i,
          exerciseId: benchPress.id,
          doneAt: addDate(new Date(), ++i * -1),
        })),
        ...sets.squat.map((set, i) => ({
          weightInKg: set,
          repetitions: set,
          exerciseId: squat.id,
          doneAt: addDate(new Date(), ++i * -1),
        })),
        ...sets.squat.slice(1, 4).map((set, i) => ({
          weightInKg: set,
          repetitions: set - ++i * 3,
          exerciseId: squat.id,
          doneAt: addDate(new Date(), ++i * -1),
        })),
        ...sets.deadlift.map((set, i) => ({
          weightInKg: set,
          repetitions: set,
          exerciseId: deadlift.id,
          doneAt: addDate(new Date(), ++i * -1),
        })),
        ...sets.deadlift.slice(1, 3).map((set, i) => ({
          weightInKg: set,
          repetitions: set - ++i * 4,
          exerciseId: deadlift.id,
          doneAt: addDate(new Date(), ++i * -1),
        })),
      ],
      db,
    ),
    addTagsToTile(
      benchPressTile.id,
      tags.filter((tag) => ["chest"].includes(tag.name)).map((tag) => tag.id),
      db,
    ),
    addTagsToTile(
      squatTile.id,
      tags.filter((tag) => ["legs"].includes(tag.name)).map((tag) => tag.id),
      db,
    ),
    addTagsToTile(
      deadliftTile.id,
      tags
        .filter((tag) => ["legs", "calfs"].includes(tag.name))
        .map((tag) => tag.id),
      db,
    ),
  ];

  await Promise.all(operations);
};

export const selectUserData = async (userId: User["id"], db: Db) => {
  return db.query.userTable.findFirst({
    where: eq(userTable.id, userId),
    columns: {
      name: true,
      email: true,
      oneRepMaxAlgo: true,
      weightUnit: true,
    },
    with: {
      tags: true,
      dashboard: {
        with: {
          tiles: {
            with: {
              exercise: {
                with: {
                  sets: true,
                },
              },
              tileToTags: true,
            },
          },
        },
      },
    },
  });
};
