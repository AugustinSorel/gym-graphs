import { Database, isUniqueViolation } from "#/integrations/db/db";
import {
  exercises,
  exercisesToTags,
  sets,
  tags,
  type Exercise,
  type ExercisesToTags,
  type Tag,
} from "#/integrations/db/schema";
import {
  DuplicateExercise,
  ExerciseNotFound,
} from "@gym-graphs/shared/exercise/errors";
import { Effect, Array } from "effect";
import { and, count, eq, gt, inArray, sql, SQL } from "drizzle-orm";
import type { SelectAllExercisesUrlParams } from "@gym-graphs/shared/exercise/schemas";

export class ExerciseRepo extends Effect.Service<ExerciseRepo>()(
  "ExerciseRepo",
  {
    accessors: true,
    effect: Effect.gen(function* () {
      const db = yield* Database;

      return {
        create: (name: Exercise["name"], userId: Exercise["userId"]) => {
          return db
            .insert(exercises)
            .values({ name, userId })
            .returning()
            .pipe(
              Effect.andThen((rows) => Array.head(rows).pipe(Effect.orDie)),
            );
        },

        createMany: (input: Array<typeof exercises.$inferInsert>) => {
          return db.insert(exercises).values(input).returning();
        },

        deleteById: (
          exerciseId: Exercise["id"],
          userId: Exercise["userId"],
        ) => {
          return db
            .delete(exercises)
            .where(
              and(eq(exercises.id, exerciseId), eq(exercises.userId, userId)),
            )
            .returning();
        },

        selectByExerciseId: (
          exerciseId: Exercise["id"],
          userId: Exercise["userId"],
        ) => {
          return Effect.gen(function* () {
            const exercise = yield* db.query.exercises.findFirst({
              where: {
                id: exerciseId,
                userId,
              },
            });

            if (!exercise) {
              return yield* Effect.fail(new ExerciseNotFound());
            }

            return yield* Effect.succeed(exercise);
          });
        },

        selectAll: (
          userId: Exercise["userId"],
          pageSize: number,
          params: Pick<
            typeof SelectAllExercisesUrlParams.Type,
            "name" | "tags" | "cursor"
          >,
        ) => {
          const filterBy = {
            name: params.name?.length ? params.name : undefined,
            tags: params.tags?.length ? params.tags : undefined,
          };

          return db.query.exercises.findMany({
            where: {
              userId,
              index: params.cursor ? { lt: params.cursor } : undefined,
              name: {
                ilike: filterBy.name ? `%${filterBy.name}%` : undefined,
              },
              tags: filterBy.tags
                ? {
                    name: {
                      in: [...filterBy.tags],
                    },
                  }
                : undefined,
            },

            orderBy: {
              index: "desc",
            },

            limit: pageSize + 1,

            with: {
              sets: {
                orderBy: {
                  doneAt: "asc",
                },
              },
              tags: true,
            },
          });
        },

        addTags: (
          exerciseId: Exercise["id"],
          tagIds: ReadonlyArray<Tag["id"]>,
        ) => {
          return db
            .insert(exercisesToTags)
            .values(tagIds.map((tagId) => ({ exerciseId, tagId })))
            .onConflictDoNothing()
            .returning();
        },

        reorder: (
          exerciseIds: Array<Exercise["id"]>,
          userId: Exercise["userId"],
        ) => {
          const sqlChunks: Array<SQL> = [];

          sqlChunks.push(sql`(case`);

          exerciseIds.forEach((exerciseId, i) => {
            sqlChunks.push(
              sql`when ${exercises.id} = ${exerciseId} then cast(${i} as integer)`,
            );
          });

          sqlChunks.push(sql`end)`);

          const finalSql = sql.join(sqlChunks, sql.raw(" "));
          return db
            .update(exercises)
            .set({ index: finalSql })
            .where(
              and(
                inArray(exercises.id, exerciseIds),
                eq(exercises.userId, userId),
              ),
            )
            .returning();
        },

        patch: (
          exerciseId: Exercise["id"],
          userId: Exercise["userId"],
          input: { name: string },
        ) => {
          return db
            .update(exercises)
            .set({ name: input.name })
            .where(
              and(eq(exercises.id, exerciseId), eq(exercises.userId, userId)),
            )
            .returning()
            .pipe(
              Effect.catchIf(
                (e) =>
                  isUniqueViolation(e, "dashboard_tiles_name_user_id_unique"),
                () => DuplicateExercise.withName(input.name),
              ),
              Effect.andThen((rows) =>
                Array.head(rows).pipe(
                  Effect.mapError(() => new ExerciseNotFound()),
                ),
              ),
            );
        },

        selectTagsByExerciseId: (
          exerciseId: Exercise["id"],
          userId: Exercise["userId"],
        ) => {
          return db.query.tags.findMany({
            where: {
              exercises: {
                AND: [{ id: exerciseId }, { userId }],
              },
            },
            orderBy: {
              createdAt: "asc",
            },
          });
        },

        putTagsByExerciseId: (
          exerciseId: ExercisesToTags["exerciseId"],
          tagIds: ReadonlyArray<ExercisesToTags["tagId"]>,
        ) => {
          return Effect.gen(function* () {
            yield* db
              .delete(exercisesToTags)
              .where(eq(exercisesToTags.exerciseId, exerciseId));

            if (tagIds.length > 0) {
              yield* db
                .insert(exercisesToTags)
                .values(tagIds.map((tagId) => ({ tagId, exerciseId })));
            }
          });
        },

        selectStats: (userId: Exercise["userId"]) => {
          const totals = db
            .select({
              totalWeightInKg:
                sql<number>`coalesce(sum(${sets.weightInKg} * ${sets.repetitions}), 0)`.mapWith(
                  Number,
                ),
              totalRepetitions:
                sql<number>`coalesce(sum(${sets.repetitions}), 0)`.mapWith(
                  Number,
                ),
            })
            .from(sets)
            .innerJoin(exercises, eq(sets.exerciseId, exercises.id))
            .where(eq(exercises.userId, userId));

          const setCountPerExercise = db
            .select({
              name: exercises.name,
              count: count(sets.id),
            })
            .from(exercises)
            .innerJoin(sets, eq(sets.exerciseId, exercises.id))
            .where(eq(exercises.userId, userId))
            .groupBy(exercises.id, exercises.name)
            .orderBy(sql`count(${sets.id}) desc`);

          const setCountPerTag = db
            .select({
              id: tags.id,
              name: tags.name,
              count: count(exercises.id),
            })
            .from(tags)
            .innerJoin(exercisesToTags, eq(exercisesToTags.tagId, tags.id))
            .innerJoin(
              exercises,
              and(
                eq(exercises.id, exercisesToTags.exerciseId),
                eq(exercises.userId, userId),
              ),
            )
            .where(
              gt(
                db
                  .select({ c: count(sets.id) })
                  .from(sets)
                  .where(eq(sets.exerciseId, exercises.id)),
                0,
              ),
            )
            .groupBy(tags.id, tags.name)
            .orderBy(sql`count(${exercises.id}) desc`);

          const allSetDates = db
            .select({ doneAt: sets.doneAt })
            .from(sets)
            .innerJoin(exercises, eq(sets.exerciseId, exercises.id))
            .where(eq(exercises.userId, userId));

          return Effect.all(
            {
              totals: totals.pipe(
                Effect.andThen((rows) =>
                  Array.head(rows).pipe(
                    Effect.orElseSucceed(() => ({
                      totalWeightInKg: 0,
                      totalRepetitions: 0,
                    })),
                  ),
                ),
              ),
              setCountPerExercise,
              setCountPerTag,
              allSetDates,
            },
            { concurrency: "unbounded" },
          );
        },
      };
    }),
  },
) {}
