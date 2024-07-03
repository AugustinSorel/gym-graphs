import { createTRPCRouter, protectedProcedure } from "../trpc";
import { exerciseSchema } from "@/schemas/exercise.schema";
import { exerciseGridPosition, exercises } from "@/server/db/schema";
import { isPgError } from "@/server/db/utils";
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
        if (isPgError(e) && e.code === "23505") {
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
        if (isPgError(e) && e.code === "23505") {
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
    return (
      await ctx.db.query.exercises.findMany({
        with: {
          data: { orderBy: (data, { asc }) => [asc(data.doneAt)] },
          position: true,
        },
        where: eq(exercises.userId, ctx.session.user.id),
      })
    ).sort((a, b) => b.position.gridPosition - a.position.gridPosition);
    //TODO: use order by rather than this crapy sort
  }),

  muscleGroup: protectedProcedure
    .input(exerciseSchema.pick({ id: true, muscleGroups: true }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(exercises)
        .set({ muscleGroups: input.muscleGroups })
        .where(eq(exercises.id, input.id));
    }),

  get: protectedProcedure
    .input(exerciseSchema.pick({ id: true }))
    .query(async ({ ctx, input }) => {
      const exercise = await ctx.db.query.exercises.findFirst({
        with: {
          data: {
            orderBy: (data, { asc }) => [asc(data.doneAt)],
          },
        },
        where: (exercise, { eq, and }) =>
          and(
            eq(exercise.id, input.id),
            eq(exercise.userId, ctx.session.user.id),
          ),
      });

      if (!exercise) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return exercise;
    }),
});
