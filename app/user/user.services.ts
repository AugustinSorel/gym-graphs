import { eq } from "drizzle-orm";
import type { Db } from "~/utils/db";
import { tagTable, User, userTable } from "~/db/db.schemas";
import { createExercises } from "~/exercise/exercise.services";
import { createExerciseSets } from "~/exercise-set/exercise-set.services";
import { createTags } from "~/tag/tag.services";

export const createUser = async (
  email: User["email"],
  password: User["password"],
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

  await createTags(
    [
      { name: "legs", userId },
      { name: "chest", userId },
      { name: "biceps", userId },
      { name: "triceps", userId },
      { name: "back", userId },
      { name: "shoulders", userId },
      { name: "calfs", userId },
      { name: "abs", userId },
      { name: "traps", userId },
    ],
    db,
  );

  const addingSetsPromise = exercises.map((exercise) => {
    const sets = [...Array(6).keys()].map((i) => {
      const values = [10, 20, 30, 40];

      const randomIndex = Math.floor(Math.random() * values.length);
      const randomValue = values.at(randomIndex);

      if (!randomValue) {
        throw new Error("random values is undefined");
      }

      return {
        exerciseId: exercise.id,
        repetitions: randomValue,
        weightInKg: randomValue,
        doneAt: new Date(new Date().setDate(new Date().getDate() - i)),
      };
    });

    return createExerciseSets(sets, db);
  });

  await Promise.all(addingSetsPromise);
};
