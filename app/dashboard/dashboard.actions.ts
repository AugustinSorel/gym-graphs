import { createServerFn } from "@tanstack/start";
import { authGuardMiddleware } from "~/auth/auth.middlewares";
import { injectDbMiddleware } from "~/db/db.middlewares";
import { tileSchema } from "~/dashboard/dashboard.schemas";
import {
  createTile,
  deleteTile,
  renameTile,
  reorderTiles,
  selectTilesFunFacts,
  selectTiles,
  selectTilesToSetsCount,
  selectTilesToTagsCount,
} from "~/dashboard/dashboard.services";
import { z } from "zod";
import pg from "pg";
import { createExercise } from "~/exercise/exercise.services";
import {
  selectSetsForThisMonth,
  transformSetsToHeatMap,
} from "~/set/set.services";
import { tagSchema } from "~/tag/tag.schemas";

export const selectTilesAction = createServerFn({ method: "GET" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .validator(
    z.object({
      name: tileSchema.shape.name
        .catch((e) => e.input)
        .optional()
        .transform((name) => name ?? ""),
      tags: tagSchema.shape.name
        .array()
        .max(200)
        .optional()
        .transform((tags) => tags ?? []),
      page: z.number().positive().catch(1),
    }),
  )
  .handler(async ({ context, data }) => {
    const pageSize = 100;

    const tiles = await selectTiles(
      data.name,
      data.tags,
      context.user.dashboard.id,
      data.page,
      pageSize,
      context.db,
    );

    const showNextPage = tiles.length > pageSize - 1;
    const nextCursor = showNextPage ? data.page + 1 : null;

    return {
      tiles,
      nextCursor,
    };
  });

export const reorderTilesAction = createServerFn({
  method: "POST",
})
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .validator(tileSchema.pick({ id: true }).array().max(200))
  .handler(async ({ context, data }) => {
    await reorderTiles(
      data.toReversed().flatMap((d) => d.id),
      context.user.dashboard.id,
      context.db,
    );
  });

export const selectTilesFunFactsAction = createServerFn({ method: "GET" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .handler(async ({ context }) => {
    return selectTilesFunFacts(context.user.id, context.db);
  });

export const renameTileAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .validator(
    z.object({
      tileId: tileSchema.shape.id,
      name: tileSchema.shape.name,
    }),
  )
  .handler(async ({ context, data }) => {
    try {
      return await renameTile(
        context.user.dashboard.id,
        data.tileId,
        data.name,
        context.db,
      );
    } catch (e) {
      const dbError = e instanceof pg.DatabaseError;
      const duplicateExercise = dbError && e.constraint === "tile_name_unique";

      if (duplicateExercise) {
        throw new Error("name already created");
      }

      throw new Error(e instanceof Error ? e.message : "something went wrong");
    }
  });

export const createExerciseTileAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .validator(tileSchema.pick({ name: true }))
  .handler(async ({ context, data }) => {
    try {
      await context.db.transaction(async (tx) => {
        const exercise = await createExercise(context.user.id, tx);
        await createTile(
          data.name,
          "exercise",
          exercise.id,
          context.user.dashboard.id,
          tx,
        );
      });
    } catch (e) {
      const dbError = e instanceof pg.DatabaseError;
      const duplicateExercise = dbError && e.constraint === "tile_name_unique";

      if (duplicateExercise) {
        throw new Error("exercise already created");
      }

      throw new Error(e instanceof Error ? e.message : "something went wrong");
    }
  });

export const deleteTileAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .validator(z.object({ tileId: tileSchema.shape.id }))
  .handler(async ({ context, data }) => {
    return await deleteTile(context.user.dashboard.id, data.tileId, context.db);
  });

export const selectTilesToSetsCountAction = createServerFn({ method: "GET" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .handler(async ({ context }) => {
    return selectTilesToSetsCount(context.user.id, context.db);
  });

export const selectTilesSetsHeatMap = createServerFn({ method: "GET" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .handler(async ({ context }) => {
    const sets = await selectSetsForThisMonth(context.user.id, context.db);

    const setsHeatMap = transformSetsToHeatMap(sets);

    return setsHeatMap;
  });

export const selectTilesToTagsCountAction = createServerFn({ method: "GET" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .handler(async ({ context }) => {
    return selectTilesToTagsCount(context.user.id, context.db);
  });
