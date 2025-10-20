import { and, asc, desc, eq, ilike, inArray, sql, SQL } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { DatabaseError } from "pg";
import {
  dashboardTable,
  setTable,
  tagTable,
  tilesToTagsTableTable,
  tileTable,
} from "~/db/db.schemas";
import type { Tag, Tile } from "~/db/db.schemas";
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

export const createMany = async (
  values: Array<typeof tileTable.$inferInsert>,
  db: Db,
) => {
  return db.insert(tileTable).values(values).returning();
};

const selectInfinite = async (
  name: Tile["name"],
  tags: Array<Tag["name"]>,
  dashboardId: Tile["dashboardId"],
  page: number,
  pageSize: number,
  db: Db,
) => {
  const tilesIdsFilteredByTags = db
    .select({ id: tileTable.id })
    .from(dashboardTable)
    .innerJoin(tileTable, eq(tileTable.dashboardId, dashboardTable.id))
    .innerJoin(
      tilesToTagsTableTable,
      eq(tilesToTagsTableTable.tileId, tileTable.id),
    )
    .innerJoin(tagTable, eq(tagTable.id, tilesToTagsTableTable.tagId))
    .where(
      and(eq(dashboardTable.id, dashboardId), inArray(tagTable.name, tags)),
    );

  return db.query.tileTable.findMany({
    where: and(
      eq(tileTable.dashboardId, dashboardId),
      ilike(tileTable.name, `%${name}%`),
      tags.length ? inArray(tileTable.id, tilesIdsFilteredByTags) : undefined,
    ),
    orderBy: desc(tileTable.index),
    limit: pageSize,
    offset: (page - 1) * pageSize,
    with: {
      tileToTags: {
        orderBy: asc(tagTable.createdAt),
        with: {
          tag: true,
        },
      },
      exercise: {
        with: {
          sets: {
            orderBy: desc(setTable.createdAt),
          },
        },
      },
    },
  });
};

const reorder = async (
  tileIds: Array<Tile["id"]>,
  dashboardId: Tile["dashboardId"],
  db: Db,
) => {
  const sqlChunks: Array<SQL> = [];

  sqlChunks.push(sql`(case`);

  tileIds.forEach((tileId, i) => {
    sqlChunks.push(
      sql`when ${tileTable.id} = ${tileId} then cast(${i} as integer)`,
    );
  });

  sqlChunks.push(sql`end)`);

  const finalSql = sql.join(sqlChunks, sql.raw(" "));

  await db
    .update(tileTable)
    .set({ index: finalSql })
    .where(
      and(
        inArray(tileTable.id, tileIds),
        eq(tileTable.dashboardId, dashboardId),
      ),
    );
};

const addTags = async (
  tileId: Tile["id"],
  tagsToAdd: Array<Tag["id"]>,
  db: Db,
) => {
  return db
    .insert(tilesToTagsTableTable)
    .values(tagsToAdd.map((tagId) => ({ tagId, tileId })))
    .returning();
};

export const tileRepo = {
  create,
  reorder,
  createMany,
  selectInfinite,
  addTags,
};
