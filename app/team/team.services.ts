import {
  and,
  count,
  desc,
  eq,
  exists,
  getTableColumns,
  gt,
  isNotNull,
  ne,
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
      teamToUsers: {
        with: {
          user: {
            columns: {
              name: true,
            },
          },
        },
      },
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

export const deleteTeamById = async (
  userId: User["id"],
  teamId: Team["id"],
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
    .delete(teamTable)
    .where(and(eq(teamTable.id, teamId), exists(adminUserInTeam)));
};

export const leaveTeam = async (
  userId: TeamsToUsers["userId"],
  teamId: TeamsToUsers["teamId"],
  db: Db,
) => {
  const teamAdmins = db.$with("team_admins").as(
    db
      .select({
        adminCount: count().as("admin_count"),
      })
      .from(teamsToUsersTable)
      .where(
        and(
          eq(teamsToUsersTable.teamId, teamId),
          eq(teamsToUsersTable.role, "admin"),
        ),
      ),
  );

  const rows = await db
    .with(teamAdmins)
    .delete(teamsToUsersTable)
    .where(
      and(
        eq(teamsToUsersTable.userId, userId),
        eq(teamsToUsersTable.teamId, teamId),
        or(
          ne(teamsToUsersTable.role, "admin"),
          and(
            eq(teamsToUsersTable.role, "admin"),
            gt(sql`(select admin_count from ${teamAdmins})`, 1),
          ),
        ),
      ),
    )
    .returning();

  if (!rows.length) {
    throw new Error(
      "You cannot leave the team because you are the only admin.",
    );
  }
};

export const kickMemberOutOfTeam = async (
  userId: TeamsToUsers["userId"],
  memberId: TeamsToUsers["userId"],
  teamId: TeamsToUsers["teamId"],
  db: Db,
) => {
  const teamAdmins = db.$with("team_admins").as(
    db
      .select({
        adminCount: count().as("admin_count"),
      })
      .from(teamsToUsersTable)
      .where(
        and(
          eq(teamsToUsersTable.teamId, teamId),
          eq(teamsToUsersTable.role, "admin"),
        ),
      ),
  );

  const userIsAdmin = db
    .select()
    .from(teamTable)
    .innerJoin(
      teamsToUsersTable,
      and(
        eq(teamsToUsersTable.teamId, teamTable.id),
        eq(teamsToUsersTable.userId, userId),
        eq(teamsToUsersTable.role, "admin"),
      ),
    )
    .where(eq(teamTable.id, teamId));

  const rows = await db
    .with(teamAdmins)
    .delete(teamsToUsersTable)
    .where(
      and(
        exists(userIsAdmin),
        eq(teamsToUsersTable.userId, memberId),
        eq(teamsToUsersTable.teamId, teamId),
        or(
          ne(teamsToUsersTable.role, "admin"),
          and(
            eq(teamsToUsersTable.role, "admin"),
            gt(sql`(select admin_count from ${teamAdmins})`, 1),
          ),
        ),
      ),
    )
    .returning();

  if (!rows.length) {
    throw new Error("Only an admin can kick a member out");
  }
};
