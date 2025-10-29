import { and, eq, exists } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { DatabaseError } from "pg";
import {
  dashboardTable,
  tagTable,
  tilesToTagsTableTable,
  tileTable,
  userTable,
} from "~/db/db.schemas";
import type { Tag, Tile, TilesToTags } from "~/db/db.schemas";
import type { Db } from "~/libs/db";
import type { PgUpdateSetSource } from "drizzle-orm/pg-core";

const create = async (name: Tag["name"], userId: Tag["userId"], db: Db) => {
  try {
    const [tag] = await db
      .insert(tagTable)
      .values({ name, userId })
      .returning();

    if (!tag) {
      throw new Error("db did not create a tag");
    }

    return tag;
  } catch (e) {
    const duplicateTag =
      e instanceof DatabaseError && e.constraint === "tag_name_user_id_unique";

    if (duplicateTag) {
      throw new HTTPException(409, {
        message: "tag already exists",
        cause: e,
      });
    }

    throw e;
  }
};

const createTileToTags = async (
  tileId: TilesToTags["tileId"],
  tagId: TilesToTags["tagId"],
  db: Db,
) => {
  const [tileToTags] = await db
    .insert(tilesToTagsTableTable)
    .values({
      tileId,
      tagId,
    })
    .returning();

  if (!tileToTags) {
    throw new HTTPException(500, { message: "tileToTags not returned by db" });
  }

  return tileToTags;
};

const createMany = async (
  tags: Array<typeof tagTable.$inferInsert>,
  db: Db,
) => {
  return db.insert(tagTable).values(tags).returning();
};

const addManyToTile = async (
  tileId: Tile["id"],
  tagsToAdd: Array<Tag["id"]>,
  db: Db,
) => {
  return db
    .insert(tilesToTagsTableTable)
    .values(tagsToAdd.map((tagId) => ({ tagId, tileId })))
    .returning();
};

const deleteById = async (tagId: Tag["id"], userId: Tag["userId"], db: Db) => {
  const [tag] = await db
    .delete(tagTable)
    .where(and(eq(tagTable.id, tagId), eq(tagTable.userId, userId)))
    .returning();

  return tag;
};

const patchById = async (
  input: PgUpdateSetSource<typeof tagTable>,
  userId: Tag["userId"],
  tagId: Tag["id"],
  db: Db,
) => {
  try {
    const [tag] = await db
      .update(tagTable)
      .set(input)
      .where(and(eq(tagTable.userId, userId), eq(tagTable.id, tagId)))
      .returning();

    return tag;
  } catch (e) {
    const duplicateTag =
      e instanceof DatabaseError && e.constraint === "tag_name_user_id_unique";

    if (duplicateTag) {
      throw new HTTPException(409, {
        message: "tag already exists",
        cause: e,
      });
    }

    throw e;
  }
};

const deleteTileTagTags = async (
  tileId: TilesToTags["tileId"],
  tagId: TilesToTags["tagId"],
  userId: Tag["userId"],
  db: Db,
) => {
  const tag = db
    .select()
    .from(tagTable)
    .where(and(eq(tagTable.userId, userId), eq(tagTable.id, tagId)));

  const tile = db
    .select()
    .from(tileTable)
    .innerJoin(dashboardTable, eq(dashboardTable.id, tileTable.dashboardId))
    .innerJoin(userTable, eq(dashboardTable.userId, userId))
    .where(eq(tileTable.id, tileId));

  const [tileTagTags] = await db
    .delete(tilesToTagsTableTable)
    .where(
      and(
        eq(tilesToTagsTableTable.tagId, tagId),
        eq(tilesToTagsTableTable.tileId, tileId),
        exists(tag),
        exists(tile),
      ),
    )
    .returning();

  return tileTagTags;
};

export const tagRepo = {
  create,
  createTileToTags,
  createMany,
  deleteById,
  patchById,
  deleteTileTagTags,
  addManyToTile,
};
