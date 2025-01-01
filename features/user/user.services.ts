import { eq } from "drizzle-orm";
import type { Db } from "~/features/utils/db";
import { User, userTable } from "~/features/db/db.schemas";

export const createUser = async (
  data: typeof userTable.$inferInsert,
  store: Db,
) => {
  const [user] = await store.insert(userTable).values(data).returning();

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
