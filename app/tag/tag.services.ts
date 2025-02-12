import { and, eq, exists, inArray } from "drizzle-orm";
import { tagTable, tileTable, tilesToTagsTableTable } from "~/db/db.schemas";
import type { Dashboard, Tag, Tile } from "~/db/db.schemas";
import type { Db } from "~/libs/db";

export const selectTileTags = async (
  dashboardId: Dashboard["id"],
  tileId: Tile["id"],
  db: Db,
) => {
  const tile = db
    .select()
    .from(tileTable)
    .where(
      and(eq(tileTable.id, tileId), eq(tileTable.dashboardId, dashboardId)),
    );

  return db.query.tilesToTagsTableTable.findMany({
    where: and(eq(tilesToTagsTableTable.tileId, tileId), exists(tile)),
  });
};

export const createTag = (name: Tag["name"], userId: Tag["userId"], db: Db) => {
  return db.insert(tagTable).values({ name, userId });
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

export const deleteTagsFromTile = async (
  tileId: Tile["id"],
  tagsToDelete: Array<Tag["id"]>,
  db: Db,
) => {
  if (!tagsToDelete.length) {
    return;
  }

  await db
    .delete(tilesToTagsTableTable)
    .where(
      and(
        eq(tilesToTagsTableTable.tileId, tileId),
        inArray(tilesToTagsTableTable.tagId, tagsToDelete),
      ),
    );
};
