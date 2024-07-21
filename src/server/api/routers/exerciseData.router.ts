import { exerciseDataSchema } from "@/schemas/exerciseData.schemas";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { and, eq, exists } from "drizzle-orm";
import { exercises, exercisesData } from "@/server/db/schema";
import { isPgError } from "@/server/db/utils";
import { syncUserStats } from "@/server/syncUsersStats";

export const exerciseDataRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      exerciseDataSchema.pick({
        exerciseId: true,
        numberOfRepetitions: true,
        weightLifted: true,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const res = await ctx.db.transaction(async (tx) => {
          const exerciseData = await tx
            .insert(exercisesData)
            .values(input)
            .returning();

          await syncUserStats(tx, ctx.session.user.id);

          return exerciseData;
        });

        return res;
      } catch (e) {
        if (isPgError(e) && e.code === "23505") {
          throw new TRPCError({
            code: "CONFLICT",
            message: "you have already entered today's data",
          });
        }

        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  updateNumberOfReps: protectedProcedure
    .input(
      exerciseDataSchema.pick({
        id: true,
        numberOfRepetitions: true,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const exercise = ctx.db
        .select()
        .from(exercises)
        .innerJoin(exercisesData, eq(exercisesData.exerciseId, exercises.id))
        .where(
          and(
            eq(exercises.userId, ctx.session.user.id),
            eq(exercisesData.id, input.id),
          ),
        );

      await ctx.db.transaction(async (tx) => {
        await tx
          .update(exercisesData)
          .set({
            numberOfRepetitions: input.numberOfRepetitions,
            updatedAt: new Date(),
          })
          .where(and(eq(exercisesData.id, input.id), exists(exercise)));

        await syncUserStats(tx, ctx.session.user.id);
      });
    }),

  updateWeightLifted: protectedProcedure
    .input(exerciseDataSchema.pick({ id: true, weightLifted: true }))
    .mutation(async ({ ctx, input }) => {
      const exercise = ctx.db
        .select()
        .from(exercises)
        .innerJoin(exercisesData, eq(exercisesData.exerciseId, exercises.id))
        .where(
          and(
            eq(exercises.userId, ctx.session.user.id),
            eq(exercisesData.id, input.id),
          ),
        );

      await ctx.db.transaction(async (tx) => {
        await tx
          .update(exercisesData)
          .set({
            weightLifted: input.weightLifted,
            updatedAt: new Date(),
          })
          .where(and(eq(exercisesData.id, input.id), exists(exercise)));

        await syncUserStats(tx, ctx.session.user.id);
      });
    }),

  updateDoneAt: protectedProcedure
    .input(exerciseDataSchema.pick({ id: true, doneAt: true }))
    .mutation(async ({ ctx, input }) => {
      try {
        const exercise = ctx.db
          .select()
          .from(exercises)
          .innerJoin(exercisesData, eq(exercisesData.exerciseId, exercises.id))
          .where(
            and(
              eq(exercises.userId, ctx.session.user.id),
              eq(exercisesData.id, input.id),
            ),
          );

        await ctx.db.transaction(async (tx) => {
          await tx
            .update(exercisesData)
            .set({
              doneAt: input.doneAt,
              updatedAt: new Date(),
            })
            .where(and(eq(exercisesData.id, input.id), exists(exercise)));

          await syncUserStats(tx, ctx.session.user.id);
        });
      } catch (e) {
        if (isPgError(e) && e.code === "23505") {
          throw new TRPCError({
            code: "CONFLICT",
            message: "This date clashes with an existing date",
          });
        }

        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  delete: protectedProcedure
    .input(exerciseDataSchema.pick({ id: true }))
    .mutation(async ({ ctx, input }) => {
      const exercise = ctx.db
        .select()
        .from(exercises)
        .innerJoin(exercisesData, eq(exercisesData.exerciseId, exercises.id))
        .where(
          and(
            eq(exercises.userId, ctx.session.user.id),
            eq(exercisesData.id, input.id),
          ),
        );

      await ctx.db.transaction(async (tx) => {
        await tx
          .delete(exercisesData)
          .where(and(eq(exercisesData.id, input.id), exists(exercise)));

        await syncUserStats(tx, ctx.session.user.id);
      });
    }),
});
