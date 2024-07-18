import type { User } from "next-auth";
import type { Db } from "./db";
import { count, eq, sql } from "drizzle-orm";
import { exercises, exercisesData, userStats } from "./db/schema";

export const syncUserStats = async (db: Db, userId: User["id"]) => {
  const exercisesExplored = db
    .select({ count: count() })
    .from(exercises)
    .where(eq(exercises.userId, userId));

  const dataLogged = db
    .select({ count: count() })
    .from(exercisesData)
    .innerJoin(exercises, eq(exercises.id, exercisesData.exerciseId))
    .where(eq(exercises.userId, userId));

  const numberOfDays = db
    .select({ count: sql`count(distinct ${exercisesData.doneAt}::date)` })
    .from(exercises)
    .innerJoin(exercisesData, eq(exercises.id, exercisesData.exerciseId))
    .where(eq(exercises.userId, userId));

  const repsMade = db
    .select({
      count: sql`COALESCE(sum(${exercisesData.numberOfRepetitions}), 0)`,
    })
    .from(exercises)
    .innerJoin(exercisesData, eq(exercises.id, exercisesData.exerciseId))
    .where(eq(exercises.userId, userId));

  const weightLifted = db
    .select({ count: sql`COALESCE(sum(${exercisesData.weightLifted}), 0)` })
    .from(exercises)
    .innerJoin(exercisesData, eq(exercises.id, exercisesData.exerciseId))
    .where(eq(exercises.userId, userId));

  //FIXME: change the hard coded field with drizzle table
  //       currently drizzle does not support that
  await db.execute(sql`
        UPDATE ${userStats}
        SET 
          number_of_exercises_created = ${exercisesExplored},
          number_of_data_logged = ${dataLogged},
          number_of_days= ${numberOfDays},
          number_of_repetitions_made = ${repsMade},
          amount_of_weight_lifted = ${weightLifted}
        WHERE ${userStats.userId} = ${userId}
      `);
};
