import { and, eq, exists } from "drizzle-orm";
import {
  dashboardTable,
  tagTable,
  tilesToTagsTableTable,
  tileTable,
  userTable,
} from "~/db/db.schemas";
import { TagDuplicateError, TagNotFoundError } from "~/tag/tag.errors";
import { TileNotFoundError } from "~/dashboard/dashboard.errors";
import type { Tag, Tile, TilesToTags } from "~/db/db.schemas";
import type { Db } from "~/libs/db";

export const createTag = async (
  name: Tag["name"],
  userId: Tag["userId"],
  db: Db,
) => {
  try {
    const [tag] = await db
      .insert(tagTable)
      .values({ name, userId })
      .returning();

    if (!tag) {
      throw new TagNotFoundError();
    }

    return tag;
  } catch (e) {
    if (TagDuplicateError.check(e)) {
      throw new TagDuplicateError();
    }

    throw e;
  }
};

export const renameTag = async (
  name: Tag["name"],
  userId: Tag["userId"],
  tagId: Tag["id"],
  db: Db,
) => {
  try {
    const [tag] = await db
      .update(tagTable)
      .set({ name })
      .where(and(eq(tagTable.userId, userId), eq(tagTable.id, tagId)))
      .returning();

    if (!tag) {
      throw new TagNotFoundError();
    }

    return tag;
  } catch (e) {
    if (TagDuplicateError.check(e)) {
      throw new TagDuplicateError();
    }

    throw e;
  }
};

export const createTags = async (
  data: Array<typeof tagTable.$inferInsert>,
  db: Db,
) => {
  return db.insert(tagTable).values(data).returning();
};

export const deleteTag = async (
  tagId: Tag["id"],
  userId: Tag["userId"],
  db: Db,
) => {
  const [tag] = await db
    .delete(tagTable)
    .where(and(eq(tagTable.id, tagId), eq(tagTable.userId, userId)))
    .returning();

  if (!tag) {
    throw new TagNotFoundError();
  }

  return tag;
};

export const addTagsToTile = async (
  tileId: Tile["id"],
  tagsToAdd: Array<Tag["id"]>,
  db: Db,
) => {
  if (!tagsToAdd.length) {
    return;
  }

  return db
    .insert(tilesToTagsTableTable)
    .values(tagsToAdd.map((tagId) => ({ tagId, tileId })))
    .returning();
};

export const addTagToTile = async (
  tileId: TilesToTags["tileId"],
  tagId: TilesToTags["tagId"],
  userId: Tag["userId"],
  db: Db,
) => {
  const [tile] = await db
    .select()
    .from(tileTable)
    .innerJoin(dashboardTable, eq(dashboardTable.id, tileTable.dashboardId))
    .innerJoin(userTable, eq(dashboardTable.userId, userId))
    .innerJoin(
      tagTable,
      and(eq(tagTable.userId, userId), eq(tagTable.id, tagId)),
    )
    .where(eq(tileTable.id, tileId));

  if (!tile) {
    throw new TileNotFoundError();
  }

  const [tag] = await db
    .insert(tilesToTagsTableTable)
    .values({
      tileId,
      tagId,
    })
    .returning();

  if (!tag) {
    throw new TagNotFoundError();
  }

  return tag;
};

export const removeTagToTile = async (
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

  const [res] = await db
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

  if (!res) {
    throw new TagNotFoundError();
  }

  return res;
};
