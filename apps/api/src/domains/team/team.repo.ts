import {
  and,
  desc,
  eq,
  getTableColumns,
  ilike,
  isNotNull,
  or,
  sql,
} from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { DatabaseError } from "pg";
import {
  teamEventNotificationTable,
  teamMemberTable,
  teamTable,
} from "~/db/db.schemas";
import type { Team, TeamMember } from "~/db/db.schemas";
import type { Db } from "~/libs/db";

export const create = async (
  name: Team["name"],
  visibility: Team["visibility"],
  db: Db,
) => {
  try {
    const [team] = await db
      .insert(teamTable)
      .values({ name, visibility })
      .returning();

    if (!team) {
      throw new Error("team not returned by db");
    }

    return team;
  } catch (e) {
    const duplicateName =
      e instanceof DatabaseError && e.constraint === "team_name_unique";

    if (duplicateName) {
      throw new HTTPException(409, { message: "team name is already used" });
    }

    throw e;
  }
};

const addMember = async (
  teamId: TeamMember["teamId"],
  userId: TeamMember["userId"],
  role: TeamMember["role"],
  db: Db,
) => {
  const [member] = await db
    .insert(teamMemberTable)
    .values({ teamId, userId, role })
    .returning();

  if (!member) {
    throw new Error("team member not returned by db");
  }

  return member;
};

const selectInfinite = async (
  userId: TeamMember["userId"],
  page: number,
  name: Team["name"],
  pageSize: number,
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
      eventNotificationCount: sql`
        (
          SELECT COUNT(*)
          FROM ${teamEventNotificationTable}
          WHERE ${teamEventNotificationTable.teamId} = ${teamTable.id}
            AND ${teamEventNotificationTable.userId} = ${userId}
            AND ${teamEventNotificationTable.readAt} IS NULL
        )
      `
        .mapWith(Number)
        .as("event_notification_count"),
    })
    .from(teamTable)
    .leftJoin(
      teamMemberTable,
      and(
        eq(teamMemberTable.teamId, teamTable.id),
        eq(teamMemberTable.userId, userId),
      ),
    )
    .where(
      and(
        or(
          eq(teamTable.visibility, "public"),
          isNotNull(teamMemberTable.userId),
        ),
        ilike(teamTable.name, `%${name}%`),
      ),
    )
    .orderBy(
      desc(sql`is_user_in_team`),
      desc(sql`event_notification_count`),
      desc(teamTable.createdAt),
    )
    .limit(pageSize)
    .offset((page - 1) * pageSize);
};

export const teamRepo = {
  selectInfinite,
  addMember,
  create,
};
