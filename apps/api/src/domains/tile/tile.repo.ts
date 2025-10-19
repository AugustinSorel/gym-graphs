import { HTTPException } from "hono/http-exception";
import { DatabaseError } from "pg";
import { tileTable, type Tile } from "~/db/db.schemas";
import type { Db } from "~/libs/db";

const create = async (
  name: Tile["name"],
  type: Tile["type"],
  exerciseId: Tile["exerciseId"],
  dashboardId: Tile["dashboardId"],
  db: Db,
) => {
  try {
    const [tile] = await db
      .insert(tileTable)
      .values({ name, type, dashboardId, exerciseId })
      .returning();

    if (!tile) {
      throw new Error("tile returned by db is null");
    }

    return tile;
  } catch (e) {
    const duplicateTile =
      e instanceof DatabaseError &&
      e.constraint === "tile_name_dashboard_id_unique";

    if (duplicateTile) {
      throw new HTTPException(422, {
        message: "tile name already exists",
        cause: e,
      });
    }

    throw e;
  }
};

export const tileRepo = {
  create,
};
