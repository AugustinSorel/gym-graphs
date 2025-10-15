import { userTable } from "~/db/db.schemas";
import { HTTPException } from "hono/http-exception";
import { DatabaseError } from "pg";
import { eq } from "drizzle-orm";
import type { User } from "~/db/db.schemas";
import type { Db } from "~/libs/db";

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

export const userRepo = {
  createWithEmailAndPassword,
  createWithEmail,
  selectByEmail,
  updateEmailVerifiedAt,
  updatePasswordAndSalt,
};
