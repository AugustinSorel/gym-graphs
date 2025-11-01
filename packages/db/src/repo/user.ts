import { tagTable, userTable } from "~/schemas";
import { DatabaseError } from "pg";
import { asc, eq } from "drizzle-orm";
import { err, ok, ResultAsync } from "neverthrow";
import { extractEntityFromRows } from "~/utils";
import { buildError } from "~/error";
import type { User } from "~/schemas";
import type { Db } from "~/db";
import type { PgUpdateSetSource } from "drizzle-orm/pg-core";

const createWithEmailAndPassword = (
  email: User["email"],
  password: NonNullable<User["password"]>,
  salt: NonNullable<User["salt"]>,
  name: User["name"],
  db: Db,
) => {
  return ResultAsync.fromPromise(
    db.insert(userTable).values({ email, password, name, salt }).returning(),
    (e) => {
      const duplicateEmail =
        e instanceof DatabaseError && e.constraint === "user_email_unique";

      if (duplicateEmail) {
        return buildError("duplicate email");
      }

      return buildError("internal", e);
    },
  ).andThen(extractEntityFromRows);
};

const createWithEmail = (email: User["email"], name: User["name"], db: Db) => {
  return ResultAsync.fromPromise(
    db
      .insert(userTable)
      .values({ email, name, emailVerifiedAt: new Date() })
      .returning(),
    (e) => buildError("internal", e),
  ).andThen(extractEntityFromRows);
};

const selectByEmail = (email: User["email"], db: Db) => {
  return ResultAsync.fromPromise(
    db.query.userTable.findFirst({
      where: eq(userTable.email, email),
    }),
    (e) => buildError("internal", e),
  ).andThen((user) => {
    if (!user) {
      return err(buildError("user not found"));
    }

    return ok(user);
  });
};

const updateEmailVerifiedAt = (userId: User["id"], db: Db) => {
  return ResultAsync.fromPromise(
    db
      .update(userTable)
      .set({ emailVerifiedAt: new Date() })
      .where(eq(userTable.id, userId))
      .returning(),
    (e) => buildError("internal", e),
  ).andThen(extractEntityFromRows);
};

const updatePasswordAndSalt = (
  password: NonNullable<User["password"]>,
  salt: NonNullable<User["salt"]>,
  userId: User["id"],
  db: Db,
) => {
  return ResultAsync.fromPromise(
    db
      .update(userTable)
      .set({ password, salt })
      .where(eq(userTable.id, userId))
      .returning(),
    (e) => buildError("internal", e),
  ).andThen(extractEntityFromRows);
};

export const selectClient = (userId: User["id"], db: Db) => {
  return ResultAsync.fromPromise(
    db.query.userTable.findFirst({
      where: eq(userTable.id, userId),
      columns: {
        id: true,
        email: true,
        weightUnit: true,
        name: true,
        oneRepMaxAlgo: true,
        dashboardView: true,
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
    }),
    (e) => buildError("internal", e),
  ).andThen((user) => {
    if (!user) {
      return err(buildError("user not found"));
    }

    return ok(user);
  });
};

const patchById = (
  input: PgUpdateSetSource<typeof userTable>,
  userId: User["id"],
  db: Db,
) => {
  return ResultAsync.fromPromise(
    db.update(userTable).set(input).where(eq(userTable.id, userId)).returning(),
    (e) => buildError("internal", e),
  ).andThen(extractEntityFromRows);
};

const deleteById = (userId: User["id"], db: Db) => {
  return ResultAsync.fromPromise(
    db.delete(userTable).where(eq(userTable.id, userId)).returning(),
    (e) => buildError("internal", e),
  ).andThen(() => ok(null));
};

const selectDataById = (userId: User["id"], db: Db) => {
  return ResultAsync.fromPromise(
    db.query.userTable.findFirst({
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
    }),
    (e) => buildError("internal", e),
  ).andThen((user) => {
    if (!user) {
      return err(buildError("user not found"));
    }

    return ok(user);
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
