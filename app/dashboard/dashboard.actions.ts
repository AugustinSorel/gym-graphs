import { createServerFn } from "@tanstack/start";
import { authGuardMiddleware } from "~/auth/auth.middlewares";
import { injectDbMiddleware } from "~/db/db.middlewares";
import { tileSchema } from "~/dashboard/dashboard.schemas";
import { reorderTiles, selectTiles } from "~/dashboard/dashboard.services";
import { z } from "zod";

export const selectTilesAction = createServerFn({ method: "GET" })
  .middleware([authGuardMiddleware, injectDbMiddleware])
  .validator(
    z.object({
      page: z.number().positive().catch(1),
    }),
  )
  .handler(async ({ context, data }) => {
    const pageSize = 100;

    const tiles = await selectTiles(
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
