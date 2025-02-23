import {
  and,
  asc,
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
import { teamMemberTable, teamTable } from "~/db/db.schemas";
import type { Db } from "~/libs/db";
import type { Team, TeamMember, User } from "~/db/db.schemas";

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
  userId: TeamMember["userId"],
  db: Db,
) => {
  return db
    .select({
      ...getTableColumns(teamTable),
      isUserInTeam: sql`
        case
          when ${teamMemberTable.userId} is not null then true
          else false
        end
      `
        .mapWith(Boolean)
        .as("is_user_in_team"),
    })
    .from(teamTable)
    .leftJoin(
      teamMemberTable,
      and(
        eq(teamMemberTable.teamId, teamTable.id),
        eq(teamMemberTable.userId, userId),
      ),
    )
    .where(or(eq(teamTable.isPublic, true), isNotNull(teamMemberTable.userId)))
    .orderBy(desc(sql`is_user_in_team`), desc(teamTable.createdAt));
};

export const createTeamToUser = async (
  teamId: TeamMember["teamId"],
  userId: TeamMember["userId"],
  role: TeamMember["role"],
  db: Db,
) => {
  return db.insert(teamMemberTable).values({
    teamId,
    userId,
    role,
  });
};

export const selectTeamById = async (
  userId: TeamMember["userId"],
  teamId: Team["id"],
  db: Db,
) => {
  const userInTeam = db
    .select()
    .from(teamMemberTable)
    .where(
      and(
        eq(teamMemberTable.userId, userId),
        eq(teamMemberTable.teamId, teamId),
      ),
    );

  return db.query.teamTable.findFirst({
    where: and(eq(teamTable.id, teamId), exists(userInTeam)),
    with: {
      members: {
        orderBy: asc(teamMemberTable.createdAt),
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
    .from(teamMemberTable)
    .where(
      and(
        eq(teamMemberTable.userId, userId),
        eq(teamMemberTable.teamId, teamId),
        eq(teamMemberTable.role, "admin"),
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
    .from(teamMemberTable)
    .where(
      and(
        eq(teamMemberTable.userId, userId),
        eq(teamMemberTable.teamId, teamId),
        eq(teamMemberTable.role, "admin"),
      ),
    );

  return db
    .delete(teamTable)
    .where(and(eq(teamTable.id, teamId), exists(adminUserInTeam)));
};

export const leaveTeam = async (
  userId: TeamMember["userId"],
  teamId: TeamMember["teamId"],
  db: Db,
) => {
  const teamAdmins = db.$with("team_admins").as(
    db
      .select({
        adminCount: count().as("admin_count"),
      })
      .from(teamMemberTable)
      .where(
        and(
          eq(teamMemberTable.teamId, teamId),
          eq(teamMemberTable.role, "admin"),
        ),
      ),
  );

  const rows = await db
    .with(teamAdmins)
    .delete(teamMemberTable)
    .where(
      and(
        eq(teamMemberTable.userId, userId),
        eq(teamMemberTable.teamId, teamId),
        or(
          ne(teamMemberTable.role, "admin"),
          and(
            eq(teamMemberTable.role, "admin"),
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
  userId: TeamMember["userId"],
  memberId: TeamMember["userId"],
  teamId: TeamMember["teamId"],
  db: Db,
) => {
  const teamAdmins = db.$with("team_admins").as(
    db
      .select({
        adminCount: count().as("admin_count"),
      })
      .from(teamMemberTable)
      .where(
        and(
          eq(teamMemberTable.teamId, teamId),
          eq(teamMemberTable.role, "admin"),
        ),
      ),
  );

  const userIsAdmin = db
    .select()
    .from(teamTable)
    .innerJoin(
      teamMemberTable,
      and(
        eq(teamMemberTable.teamId, teamTable.id),
        eq(teamMemberTable.userId, userId),
        eq(teamMemberTable.role, "admin"),
      ),
    )
    .where(eq(teamTable.id, teamId));

  const rows = await db
    .with(teamAdmins)
    .delete(teamMemberTable)
    .where(
      and(
        exists(userIsAdmin),
        eq(teamMemberTable.userId, memberId),
        eq(teamMemberTable.teamId, teamId),
        or(
          ne(teamMemberTable.role, "admin"),
          and(
            eq(teamMemberTable.role, "admin"),
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
