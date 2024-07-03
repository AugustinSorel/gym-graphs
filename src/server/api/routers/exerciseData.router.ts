import { exerciseDataSchema } from "@/schemas/exerciseData.schemas";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { and, eq, ne } from "drizzle-orm";
import { exercisesData } from "@/server/db/schema";
import { isPgError } from "@/server/db/utils";

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
        const res = await ctx.db
          .insert(exercisesData)
          .values(input)
          .returning();

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
      await ctx.db
        .update(exercisesData)
        .set({
          numberOfRepetitions: input.numberOfRepetitions,
          updatedAt: new Date(),
        })
        .where(eq(exercisesData.id, input.id));
    }),

  updateWeightLifted: protectedProcedure
    .input(exerciseDataSchema.pick({ id: true, weightLifted: true }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(exercisesData)
        .set({
          weightLifted: input.weightLifted,
          updatedAt: new Date(),
        })
        .where(eq(exercisesData.id, input.id));
    }),

  updateDoneAt: protectedProcedure
    .input(exerciseDataSchema.pick({ id: true, doneAt: true }))
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.db
          .update(exercisesData)
          .set({
            doneAt: input.doneAt,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(exercisesData.id, input.id),
              ne(exercisesData.doneAt, input.doneAt),
            ),
          );
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
      await ctx.db.delete(exercisesData).where(eq(exercisesData.id, input.id));
    }),
});
