import { exercises, exercisesData, users, userStats } from "@/server/db/schema";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { count, eq, sql, sum } from "drizzle-orm";
import { userSchema } from "@/schemas/user.schema";
import { TRPCError } from "@trpc/server";
import type { db } from "@/server/db";
import type { User } from "next-auth";

export const userRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.query.users.findFirst({
      where: eq(users.id, ctx.session.user.id),
      with: {
        stats: true,
      },
    });

    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "user not found" });
    }

    return user;
  }),

  delete: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db.delete(users).where(eq(users.id, ctx.session.user.id));
  }),

  rename: protectedProcedure
    .input(userSchema.pick({ name: true }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(users)
        .set({ name: input.name })
        .where(eq(users.id, ctx.session.user.id));
    }),
});

export const syncUserStats = async (idk: typeof db, userId: User["id"]) => {
  const exercisesExplored = idk
    .select({ count: count() })
    .from(exercises)
    .where(eq(exercises.userId, userId));

  const dataLogged = idk
    .select({ count: count() })
    .from(exercisesData)
    .innerJoin(exercises, eq(exercises.id, exercisesData.exerciseId))
    .where(eq(exercises.userId, userId));

  const numberOfDays = idk
    .select({ count: sql`count(distinct ${exercisesData.doneAt}::date)` })
    .from(exercises)
    .innerJoin(exercisesData, eq(exercises.id, exercisesData.exerciseId))
    .where(eq(exercises.userId, userId));

  const repsMade = idk
    .select({ count: sum(exercisesData.numberOfRepetitions) })
    .from(exercises)
    .innerJoin(exercisesData, eq(exercises.id, exercisesData.exerciseId))
    .where(eq(exercises.userId, userId));

  const weightLifted = idk
    .select({ count: sum(exercisesData.weightLifted) })
    .from(exercises)
    .innerJoin(exercisesData, eq(exercises.id, exercisesData.exerciseId))
    .where(eq(exercises.userId, userId));

  //FIXME: change the hard coded field with drizzle table
  //       currently drizzle does not support that
  await idk.execute(sql`
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
