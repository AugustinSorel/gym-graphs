import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { DatabaseError } from "pg";
import { tagTable } from "~/db/db.schemas";
import type { Tag } from "~/db/db.schemas";
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

const createMany = async (
  tags: Array<typeof tagTable.$inferInsert>,
  db: Db,
) => {
  return db.insert(tagTable).values(tags).returning();
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

export const tagRepo = {
  create,
  createMany,
  deleteById,
  patchById,
};
