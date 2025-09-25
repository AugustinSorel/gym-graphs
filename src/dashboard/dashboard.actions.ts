import { createServerFn } from "@tanstack/react-start";
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
import { createExercise } from "~/exercise/exercise.services";
import {
  selectSetsForThisMonth,
  transformSetsToHeatMap,
} from "~/set/set.services";
import { tagSchema } from "~/tag/tag.schemas";

export const selectTilesAction = createServerFn({ method: "GET" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .inputValidator(
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
  .inputValidator(tileSchema.pick({ id: true }).array().max(200))
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
  .inputValidator(
    z.object({
      tileId: tileSchema.shape.id,
      name: tileSchema.shape.name,
    }),
  )
  .handler(async ({ context, data }) => {
    await renameTile(
      context.user.dashboard.id,
      data.tileId,
      data.name,
      context.db,
    );
  });

export const createExerciseTileAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .inputValidator(tileSchema.pick({ name: true }))
  .handler(async ({ context, data }) => {
    await context.db.transaction(async (tx) => {
      const exercise = await createExercise(tx);
      await createTile(
        data.name,
        "exercise",
        exercise.id,
        context.user.dashboard.id,
        tx,
      );
    });
  });

export const deleteTileAction = createServerFn({ method: "POST" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .inputValidator(z.object({ tileId: tileSchema.shape.id }))
  .handler(async ({ context, data }) => {
    await deleteTile(context.user.dashboard.id, data.tileId, context.db);
  });

export const selectTilesToSetsCountAction = createServerFn({ method: "GET" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .handler(async ({ context }) => {
    return selectTilesToSetsCount(context.user.dashboard.id, context.db);
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
