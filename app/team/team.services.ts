import {
  and,
  desc,
  eq,
  exists,
  getTableColumns,
  isNotNull,
  or,
  sql,
} from "drizzle-orm";
import { teamsToUsersTable, teamTable } from "~/db/db.schemas";
import type { Db } from "~/libs/db";
import type { Team, TeamsToUsers, User } from "~/db/db.schemas";

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

export const selectTeamById = async (
  userId: TeamsToUsers["userId"],
  teamId: Team["id"],
  db: Db,
) => {
  const userInTeam = db
    .select()
    .from(teamsToUsersTable)
    .where(
      and(
        eq(teamsToUsersTable.userId, userId),
        eq(teamsToUsersTable.teamId, teamId),
      ),
    );

  return db.query.teamTable.findFirst({
    where: and(eq(teamTable.id, teamId), exists(userInTeam)),
    with: {
      teamToUsers: true,
    },
  });
};

export const renameTeamById = async (
  userId: User["id"],
  teamId: Team["id"],
  name: Team["name"],
  db: Db,
) => {
  const adminUserInTeam = db
    .select()
    .from(teamsToUsersTable)
    .where(
      and(
        eq(teamsToUsersTable.userId, userId),
        eq(teamsToUsersTable.teamId, teamId),
        eq(teamsToUsersTable.role, "admin"),
      ),
    );

  return db
    .update(teamTable)
    .set({
      name,
      updatedAt: new Date(),
    })
    .where(and(eq(teamTable.id, teamId), exists(adminUserInTeam)));
};
