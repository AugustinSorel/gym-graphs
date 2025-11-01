import { tagRepo } from "@gym-graphs/db/repo/tag";
import { dbErrorToHttp } from "~/libs/db";
import type { Tag } from "@gym-graphs/db/schemas";
import type { Db } from "@gym-graphs/db";

const create = async (name: Tag["name"], userId: Tag["userId"], db: Db) => {
  return tagRepo.create(name, userId, db).match((tag) => tag, dbErrorToHttp);
};

const deleteById = async (tagId: Tag["id"], userId: Tag["userId"], db: Db) => {
  return tagRepo
    .deleteById(tagId, userId, db)
    .match((tag) => tag, dbErrorToHttp);
};

const patchById = async (
  input: Parameters<typeof tagRepo.patchById>[0],
  userId: Tag["userId"],
  tagId: Tag["id"],
  db: Db,
) => {
  return tagRepo
    .patchById(input, userId, tagId, db)
    .match((tag) => tag, dbErrorToHttp);
};

export const tagService = {
  create,
  deleteById,
  patchById,
};
