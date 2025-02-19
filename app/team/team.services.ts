import { desc, eq } from "drizzle-orm";
import { Team, teamTable } from "~/db/db.schemas";
import { Db } from "~/libs/db";

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
