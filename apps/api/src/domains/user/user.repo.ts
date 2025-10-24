import { tagTable, userTable } from "~/db/db.schemas";
import { HTTPException } from "hono/http-exception";
import { DatabaseError } from "pg";
import { asc, eq, sql } from "drizzle-orm";
import type { User } from "~/db/db.schemas";
import type { Db } from "~/libs/db";
import type { PgUpdateSetSource } from "drizzle-orm/pg-core";

const createWithEmailAndPassword = async (
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
      throw new Error("db did not create a user");
    }

    return user;
  } catch (e) {
    const duplicateEmail =
      e instanceof DatabaseError && e.constraint === "user_email_unique";

    if (duplicateEmail) {
      throw new HTTPException(409, {
        message: "email is already used",
        cause: e,
      });
    }

    throw e;
  }
};

const createWithEmail = async (
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
    throw new HTTPException(500, { message: "db did not return a user" });
  }

  return user;
};

const selectByEmail = async (email: User["email"], db: Db) => {
  return db.query.userTable.findFirst({
    where: eq(userTable.email, email),
  });
};

const updateEmailVerifiedAt = async (userId: User["id"], db: Db) => {
  const [user] = await db
    .update(userTable)
    .set({ emailVerifiedAt: new Date() })
    .where(eq(userTable.id, userId))
    .returning();

  return user;
};

const updatePasswordAndSalt = async (
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

  return user;
};

export const selectClient = async (userId: User["id"], db: Db) => {
  return db.query.userTable.findFirst({
    where: eq(userTable.id, userId),
    columns: {
      id: true,
      email: true,
      weightUnit: true,
      name: true,
      oneRepMaxAlgo: true,
      dashboardView: true,
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

const patchById = async (
  input: PgUpdateSetSource<typeof userTable>,
  userId: User["id"],
  db: Db,
) => {
  const [user] = await db
    .update(userTable)
    .set(input)
    .where(eq(userTable.id, userId))
    .returning();

  return user;
};

const deleteById = async (userId: User["id"], db: Db) => {
  const [user] = await db
    .delete(userTable)
    .where(eq(userTable.id, userId))
    .returning();

  return user;
};

const selectDataById = async (userId: User["id"], db: Db) => {
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
              exerciseOverview: {
                with: {
                  exercise: {
                    with: {
                      sets: true,
                    },
                  },
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
export const userRepo = {
  createWithEmailAndPassword,
  createWithEmail,
  selectByEmail,
  selectClient,
  selectDataById,
  updateEmailVerifiedAt,
  updatePasswordAndSalt,
  patchById,
  deleteById,
};
