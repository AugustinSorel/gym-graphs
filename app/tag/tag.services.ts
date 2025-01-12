import { and, eq } from "drizzle-orm";
import { Tag, tagTable } from "~/db/db.schemas";
import { Db } from "~/utils/db";

export const createTag = (name: Tag["name"], userId: Tag["userId"], db: Db) => {
  return db.insert(tagTable).values({ name, userId });
};

export const createTags = async (
  data: Array<typeof tagTable.$inferInsert>,
  db: Db,
) => {
  return db.insert(tagTable).values(data);
};

export const deleteTag = async (
  name: Tag["name"],
  userId: Tag["userId"],
  db: Db,
) => {
  return db
    .delete(tagTable)
    .where(and(eq(tagTable.name, name), eq(tagTable.userId, userId)));
};
