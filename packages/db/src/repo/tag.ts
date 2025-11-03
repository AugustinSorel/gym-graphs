import { and, eq, exists } from "drizzle-orm";
import { DatabaseError } from "pg";
import {
  dashboardTable,
  tagTable,
  tilesToTagsTableTable,
  tileTable,
  userTable,
} from "~/schemas";
import { ok, ResultAsync } from "neverthrow";
import { buildError } from "~/error";
import { extractEntityFromRows } from "~/utils";
import type { Tag, Tile, TilesToTags } from "~/schemas";
import type { Db } from "~/db";
import type { PgUpdateSetSource } from "drizzle-orm/pg-core";

const create = (name: Tag["name"], userId: Tag["userId"], db: Db) => {
  return ResultAsync.fromPromise(
    db.insert(tagTable).values({ name, userId }).returning(),
    (e) => {
      const duplicateTag =
        e instanceof Error &&
        e.cause instanceof DatabaseError &&
        e.cause.constraint === "tag_name_user_id_unique";

      if (duplicateTag) {
        return buildError("duplicate tag name");
      }

      return buildError("internal", e);
    },
  ).andThen(extractEntityFromRows);
};

const createTileToTags = (
  tileId: TilesToTags["tileId"],
  tagId: TilesToTags["tagId"],
  db: Db,
) => {
  return ResultAsync.fromPromise(
    db.insert(tilesToTagsTableTable).values({ tileId, tagId }).returning(),
    (e) => buildError("internal", e),
  ).andThen(extractEntityFromRows);
};

const createMany = (tags: Array<typeof tagTable.$inferInsert>, db: Db) => {
  return ResultAsync.fromPromise(
    db.insert(tagTable).values(tags).returning(),
    (e) => buildError("internal", e),
  );
};

const addManyToTile = (
  tileId: Tile["id"],
  tagsToAdd: Array<Tag["id"]>,
  db: Db,
) => {
  return ResultAsync.fromPromise(
    db
      .insert(tilesToTagsTableTable)
      .values(tagsToAdd.map((tagId) => ({ tagId, tileId })))
      .returning(),
    (e) => buildError("internal", e),
  );
};

const deleteById = (tagId: Tag["id"], userId: Tag["userId"], db: Db) => {
  return ResultAsync.fromPromise(
    db
      .delete(tagTable)
      .where(and(eq(tagTable.id, tagId), eq(tagTable.userId, userId)))
      .returning(),
    (e) => buildError("internal", e),
  ).andThen(() => ok(null));
};

const patchById = (
  input: PgUpdateSetSource<typeof tagTable>,
  userId: Tag["userId"],
  tagId: Tag["id"],
  db: Db,
) => {
  return ResultAsync.fromPromise(
    db
      .update(tagTable)
      .set(input)
      .where(and(eq(tagTable.userId, userId), eq(tagTable.id, tagId)))
      .returning(),
    (e) => {
      const duplicateTag =
        e instanceof Error &&
        e.cause instanceof DatabaseError &&
        e.cause.constraint === "tag_name_user_id_unique";

      if (duplicateTag) {
        return buildError("duplicate tag name");
      }

      return buildError("internal", e);
    },
  ).andThen(extractEntityFromRows);
};

const deleteTileTagTags = (
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

  return ResultAsync.fromPromise(
    db
      .delete(tilesToTagsTableTable)
      .where(
        and(
          eq(tilesToTagsTableTable.tagId, tagId),
          eq(tilesToTagsTableTable.tileId, tileId),
          exists(tag),
          exists(tile),
        ),
      )
      .returning(),
    (e) => buildError("internal", e),
  ).andThen(() => ok(null));
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
