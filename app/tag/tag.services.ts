import { and, eq, exists } from "drizzle-orm";
import {
  dashboardTable,
  tagTable,
  tilesToTagsTableTable,
  tileTable,
  userTable,
} from "~/db/db.schemas";
import type { Tag, Tile, TilesToTags } from "~/db/db.schemas";
import type { Db } from "~/libs/db";

export const createTag = (name: Tag["name"], userId: Tag["userId"], db: Db) => {
  return db.insert(tagTable).values({ name, userId });
};

export const renameTag = (
  name: Tag["name"],
  userId: Tag["userId"],
  tagId: Tag["id"],
  db: Db,
) => {
  return db
    .update(tagTable)
    .set({ name })
    .where(and(eq(tagTable.userId, userId), eq(tagTable.id, tagId)));
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
  return db
    .delete(tagTable)
    .where(and(eq(tagTable.id, tagId), eq(tagTable.userId, userId)));
};

export const addTagsToTile = async (
  tileId: Tile["id"],
  tagsToAdd: Array<Tag["id"]>,
  db: Db,
) => {
  if (!tagsToAdd.length) {
    return;
  }

  await db
    .insert(tilesToTagsTableTable)
    .values(tagsToAdd.map((tagId) => ({ tagId, tileId })));
};

export const addTagToTile = async (
  tileId: TilesToTags["tileId"],
  tagId: TilesToTags["tagId"],
  userId: Tag["userId"],
  db: Db,
) => {
  const [res] = await db
    .select()
    .from(tileTable)
    .innerJoin(dashboardTable, eq(dashboardTable.id, tileTable.dashboardId))
    .innerJoin(userTable, eq(dashboardTable.userId, userId))
    .innerJoin(
      tagTable,
      and(eq(tagTable.userId, userId), eq(tagTable.id, tagId)),
    )
    .where(eq(tileTable.id, tileId));

  if (!res) {
    throw new Error("unauthorized");
  }

  return db.insert(tilesToTagsTableTable).values({
    tileId,
    tagId,
  });
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

  const res = await db
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

  if (!res.length) {
    throw new Error("unauthorized");
  }
};
