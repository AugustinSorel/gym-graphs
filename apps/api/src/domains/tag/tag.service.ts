import { tagRepo } from "~/domains/tag/tag.repo";
import { HTTPException } from "hono/http-exception";
import type { Tag, tagTable } from "~/db/db.schemas";
import type { Db } from "~/libs/db";
import type { PgUpdateSetSource } from "drizzle-orm/pg-core";

const create = async (name: Tag["name"], userId: Tag["userId"], db: Db) => {
  return tagRepo.create(name, userId, db);
};

const deleteById = async (tagId: Tag["id"], userId: Tag["userId"], db: Db) => {
  const tag = await tagRepo.deleteById(tagId, userId, db);

  if (!tag) {
    throw new HTTPException(404, { message: "tag not found" });
  }

  return tag;
};

const patchById = async (
  input: PgUpdateSetSource<typeof tagTable>,
  userId: Tag["userId"],
  tagId: Tag["id"],
  db: Db,
) => {
  const tag = await tagRepo.patchById(input, userId, tagId, db);

  if (!tag) {
    throw new HTTPException(404, { message: "tag not found" });
  }

  return tag;
};

export const tagService = {
  create,
  deleteById,
  patchById,
};
