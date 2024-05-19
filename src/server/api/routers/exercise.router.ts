import { exerciseSchema } from "@/schemas/exerciseSchemas";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { exerciseGridPosition, exercises } from "@/db/schema";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";

export const exerciseRouter = createTRPCRouter({
  create: protectedProcedure
    .input(exerciseSchema.pick({ name: true }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.db.transaction(async (tx) => {
          const exerciseCreated = await tx
            .insert(exercises)
            .values({ name: input.name, userId: ctx.session.user.id })
            .returning();

          if (exerciseCreated[0]) {
            await tx.insert(exerciseGridPosition).values({
              userId: ctx.session.user.id,
              exerciseId: exerciseCreated[0].id,
            });
          }

          return exerciseCreated;
        });
      } catch (e) {
        const error = e as object;

        if ("code" in error && error.code === "23505") {
          throw new TRPCError({
            code: "CONFLICT",
            message: `${input.name} is already used`,
          });
        }

        if (e instanceof Error) {
          throw new Error(e.message);
        }
      }
    }),

  delete: protectedProcedure
    .input(exerciseSchema.pick({ id: true }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(exercises)
        .where(
          and(
            eq(exercises.id, input.id),
            eq(exercises.userId, ctx.session.user.id),
          ),
        )
        .returning();
    }),

  update: protectedProcedure
    .input(exerciseSchema.pick({ id: true, name: true }))
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.db
          .update(exercises)
          .set({ name: input.name, updatedAt: new Date() })
          .where(
            and(
              eq(exercises.id, input.id),
              eq(exercises.userId, ctx.session.user.id),
            ),
          )
          .returning();
      } catch (e) {
        const error = e as object;

        if ("code" in error && error.code === "23505") {
          throw new TRPCError({
            code: "CONFLICT",
            message: `${input.name} is already used`,
          });
        }

        if (e instanceof Error) {
          throw new Error(e.message);
        }
      }
    }),

  move: protectedProcedure
    .input(exerciseSchema.shape.id.array())
    .mutation(async ({ ctx, input }) => {
      await ctx.db.transaction(async (tx) => {
        await tx
          .delete(exerciseGridPosition)
          .where(eq(exerciseGridPosition.userId, ctx.session.user.id));

        await tx.insert(exerciseGridPosition).values(
          input.reverse().map((exerciseId) => ({
            exerciseId: exerciseId,
            userId: ctx.session.user.id,
          })),
        );
      });
    }),

  all: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(exercises)
      .where(eq(exercises.userId, ctx.session.user.id));
  }),

  muscleGroup: protectedProcedure
    .input(exerciseSchema.pick({ id: true, muscleGroups: true }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(exercises)
        .set({ muscleGroups: input.muscleGroups })
        .where(eq(exercises.id, input.id));
    }),
});
