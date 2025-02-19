import { desc, eq } from "drizzle-orm";
import { teamTable } from "~/db/db.schemas";
import type { Db } from "~/libs/db";
import type { Team } from "~/db/db.schemas";

export const createTeam = async (
  name: Team["name"],
  isPublic: Team["isPublic"],
  db: Db,
) => {
  return db.insert(teamTable).values({ name, isPublic });
};

export const selectPublicTeams = async (db: Db) => {
  return db.query.teamTable.findMany({
    orderBy: desc(teamTable.createdAt),
    where: eq(teamTable.isPublic, true),
  });
};
