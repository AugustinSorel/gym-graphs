import { Database } from "#/integrations/db/db";
import { sets, type Set } from "#/integrations/db/schema";
import { SetNotFound } from "@gym-graphs/shared/set/errors";
import { and, eq } from "drizzle-orm";
import { Effect, Array } from "effect";

export class SetRepo extends Effect.Service<SetRepo>()("SetRepo", {
  accessors: true,
  effect: Effect.gen(function* () {
    const db = yield* Database;

    return {
      create: (input: {
        exerciseId: Set["exerciseId"];
        weightInKg: Set["weightInKg"];
        repetitions: Set["repetitions"];
        doneAt: Set["doneAt"];
      }) => {
        return db
          .insert(sets)
          .values(input)
          .returning()
          .pipe(
            Effect.andThen((rows) => Array.head(rows).pipe(Effect.orDie)),
          );
      },

      createMany: (
        input: Array<{
          exerciseId: Set["exerciseId"];
          weightInKg: Set["weightInKg"];
          repetitions: Set["repetitions"];
          doneAt: Set["doneAt"];
        }>,
      ) => {
        return db.insert(sets).values(input).returning();
      },

      patch: (
        setId: Set["id"],
        exerciseId: Set["exerciseId"],
        input: {
          weightInKg?: Set["weightInKg"];
          repetitions?: Set["repetitions"];
          doneAt?: Set["doneAt"];
        },
      ) => {
        return db
          .update(sets)
          .set(input)
          .where(and(eq(sets.id, setId), eq(sets.exerciseId, exerciseId)))
          .returning()
          .pipe(
            Effect.andThen((rows) =>
              Array.head(rows).pipe(
                Effect.mapError(() => new SetNotFound()),
              ),
            ),
          );
      },

      deleteById: (setId: Set["id"], exerciseId: Set["exerciseId"]) => {
        return db
          .delete(sets)
          .where(and(eq(sets.id, setId), eq(sets.exerciseId, exerciseId)))
          .returning()
          .pipe(
            Effect.andThen((rows) =>
              Array.head(rows).pipe(
                Effect.mapError(() => new SetNotFound()),
              ),
            ),
          );
      },
    };
  }),
}) {}
