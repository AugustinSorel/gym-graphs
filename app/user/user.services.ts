import { eq } from "drizzle-orm";
import type { Db } from "~/utils/db";
import { User, userTable } from "~/db/db.schemas";
import { createExercises } from "~/exercise/exercise.services";
import { createExerciseSets } from "~/exercise-set/exercise-set.services";

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

export const renameUser = async (
  name: User["name"],
  userId: User["id"],
  db: Db,
) => {
  await db.update(userTable).set({ name }).where(eq(userTable.id, userId));
};

export const deleteUser = async (userId: User["id"], db: Db) => {
  await db.delete(userTable).where(eq(userTable.id, userId));
};

export const seedUserAccount = async (userId: User["id"], db: Db) => {
  const exercises = await createExercises(
    [
      { name: "bench press", userId },
      { name: "squat", userId },
      { name: "deadlift", userId },
    ],
    db,
  );

  await Promise.resolve(
    exercises.map((exercise) => {
      const sets = [...Array(3).keys()].map((i) => {
        const repetitionCount = Math.floor(Math.random() * 10 * (i + 1));
        const weightLifted = Math.floor(Math.random() * 30 * (i + 1));
        //todo: insert good formula

        return {
          exerciseId: exercise.id,
          repetitionCount,
          weightLifted,
          oneRepMax: repetitionCount + weightLifted,
        };
      });

      return createExerciseSets(sets, db);
    }),
  );
};
