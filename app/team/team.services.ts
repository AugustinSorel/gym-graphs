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
import { memberTable, teamTable } from "~/db/db.schemas";
import type { Db } from "~/libs/db";
import type { Team, Member, User } from "~/db/db.schemas";

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
  userId: Member["userId"],
  db: Db,
) => {
  return db
    .select({
      ...getTableColumns(teamTable),
      isUserInTeam: sql`
        case
          when ${memberTable.userId} is not null then true
          else false
        end
      `
        .mapWith(Boolean)
        .as("is_user_in_team"),
    })
    .from(teamTable)
    .leftJoin(
      memberTable,
      and(eq(memberTable.teamId, teamTable.id), eq(memberTable.userId, userId)),
    )
    .where(or(eq(teamTable.isPublic, true), isNotNull(memberTable.userId)))
    .orderBy(desc(sql`is_user_in_team`), desc(teamTable.createdAt));
};

export const createTeamToUser = async (
  teamId: Member["teamId"],
  userId: Member["userId"],
  role: Member["role"],
  db: Db,
) => {
  return db.insert(memberTable).values({
    teamId,
    userId,
    role,
  });
};

export const selectTeamById = async (
  userId: Member["userId"],
  teamId: Team["id"],
  db: Db,
) => {
  const userInTeam = db
    .select()
    .from(memberTable)
    .where(and(eq(memberTable.userId, userId), eq(memberTable.teamId, teamId)));

  return db.query.teamTable.findFirst({
    where: and(eq(teamTable.id, teamId), exists(userInTeam)),
    with: {
      members: {
        orderBy: asc(memberTable.createdAt),
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
    .from(memberTable)
    .where(
      and(
        eq(memberTable.userId, userId),
        eq(memberTable.teamId, teamId),
        eq(memberTable.role, "admin"),
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
    .from(memberTable)
    .where(
      and(
        eq(memberTable.userId, userId),
        eq(memberTable.teamId, teamId),
        eq(memberTable.role, "admin"),
      ),
    );

  return db
    .delete(teamTable)
    .where(and(eq(teamTable.id, teamId), exists(adminUserInTeam)));
};

export const leaveTeam = async (
  userId: Member["userId"],
  teamId: Member["teamId"],
  db: Db,
) => {
  const teamAdmins = db.$with("team_admins").as(
    db
      .select({
        adminCount: count().as("admin_count"),
      })
      .from(memberTable)
      .where(
        and(eq(memberTable.teamId, teamId), eq(memberTable.role, "admin")),
      ),
  );

  const rows = await db
    .with(teamAdmins)
    .delete(memberTable)
    .where(
      and(
        eq(memberTable.userId, userId),
        eq(memberTable.teamId, teamId),
        or(
          ne(memberTable.role, "admin"),
          and(
            eq(memberTable.role, "admin"),
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
  userId: Member["userId"],
  memberId: Member["userId"],
  teamId: Member["teamId"],
  db: Db,
) => {
  const teamAdmins = db.$with("team_admins").as(
    db
      .select({
        adminCount: count().as("admin_count"),
      })
      .from(memberTable)
      .where(
        and(eq(memberTable.teamId, teamId), eq(memberTable.role, "admin")),
      ),
  );

  const userIsAdmin = db
    .select()
    .from(teamTable)
    .innerJoin(
      memberTable,
      and(
        eq(memberTable.teamId, teamTable.id),
        eq(memberTable.userId, userId),
        eq(memberTable.role, "admin"),
      ),
    )
    .where(eq(teamTable.id, teamId));

  const rows = await db
    .with(teamAdmins)
    .delete(memberTable)
    .where(
      and(
        exists(userIsAdmin),
        eq(memberTable.userId, memberId),
        eq(memberTable.teamId, teamId),
        or(
          ne(memberTable.role, "admin"),
          and(
            eq(memberTable.role, "admin"),
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
