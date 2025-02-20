import {
  and,
  count,
  desc,
  eq,
  getTableColumns,
  isNotNull,
  or,
  sql,
} from "drizzle-orm";
import { teamsToUsersTable, teamTable } from "~/db/db.schemas";
import type { Db } from "~/libs/db";
import type { Team, TeamsToUsers } from "~/db/db.schemas";

export const createTeam = async (
  name: Team["name"],
  isPublic: Team["isPublic"],
  db: Db,
) => {
  const [team] = await db
    .insert(teamTable)
    .values({ name, isPublic })
    .returning();

  if (!team) {
    throw new Error("team returned by db is null");
  }

  return team;
};

export const selectUserAndPublicTeams = async (
  userId: TeamsToUsers["userId"],
  db: Db,
) => {
  return db
    .select({
      ...getTableColumns(teamTable),
      isUserInTeam: sql`
        case
          when ${teamsToUsersTable.userId} is not null then true
          else false
        end
      `
        .mapWith(Boolean)
        .as("is_user_in_team"),
    })
    .from(teamTable)
    .leftJoin(
      teamsToUsersTable,
      and(
        eq(teamsToUsersTable.teamId, teamTable.id),
        eq(teamsToUsersTable.userId, userId),
      ),
    )
    .where(
      or(eq(teamTable.isPublic, true), isNotNull(teamsToUsersTable.userId)),
    )
    .orderBy(desc(sql`is_user_in_team`), desc(teamTable.createdAt));
};

export const createTeamToUser = async (
  teamId: TeamsToUsers["teamId"],
  userId: TeamsToUsers["userId"],
  role: TeamsToUsers["role"],
  db: Db,
) => {
  return db.insert(teamsToUsersTable).values({
    teamId,
    userId,
    role,
  });
};
