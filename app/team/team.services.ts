import {
  and,
  asc,
  count,
  desc,
  eq,
  exists,
  getTableColumns,
  gt,
  ilike,
  isNotNull,
  ne,
  or,
  sql,
} from "drizzle-orm";
import {
  dashboardTable,
  setTable,
  teamEventReactionTable,
  teamEventTable,
  teamInvitationTable,
  teamJoinRequestTable,
  teamMemberTable,
  teamTable,
  tileTable,
  userTable,
  exerciseTable,
} from "~/db/db.schemas";
import { addDate } from "~/utils/date";
import { randomBytes } from "crypto";
import type { Db } from "~/libs/db";
import type {
  Team,
  TeamEventReaction,
  TeamInvitation,
  TeamJoinRequest,
  TeamMember,
  User,
} from "~/db/db.schemas";

export const createTeam = async (
  name: Team["name"],
  visibility: Team["visibility"],
  db: Db,
) => {
  const [team] = await db
    .insert(teamTable)
    .values({ name, visibility })
    .returning();

  if (!team) {
    throw new Error("team returned by db is null");
  }

  return team;
};

export const selectUserAndPublicTeams = async (
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
    .orderBy(desc(sql`is_user_in_team`), desc(teamTable.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);
};

export const createTeamMember = async (
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
  memberId: TeamMember["userId"],
  teamId: Team["id"],
  db: Db,
) => {
  const memberInTeam = db
    .select()
    .from(teamMemberTable)
    .where(
      and(
        eq(teamMemberTable.userId, memberId),
        eq(teamMemberTable.teamId, teamId),
      ),
    );

  const memberIsAdmin = db
    .select()
    .from(teamMemberTable)
    .where(
      and(
        eq(teamMemberTable.userId, memberId),
        eq(teamMemberTable.teamId, teamId),
        eq(teamMemberTable.role, "admin"),
      ),
    );

  return db.query.teamTable.findFirst({
    where: eq(teamTable.id, teamId),
    extras: {
      memberInTeam: sql`(SELECT EXISTS ${memberInTeam} END)`
        .mapWith(Boolean)
        .as("member_in_team"),
    },
    with: {
      invitations: {
        where: exists(memberIsAdmin),
        columns: {
          id: true,
          email: true,
          status: true,
        },
      },
      joinRequests: {
        where: exists(memberIsAdmin),
        orderBy: asc(teamMemberTable.createdAt),
        with: {
          user: {
            columns: {
              email: true,
              name: true,
            },
          },
        },
      },
      members: {
        where: exists(memberInTeam),
        orderBy: asc(teamMemberTable.createdAt),
        extras: {
          totalWeightInKg: sql`(${db
            .select({
              sum: sql`sum(${setTable.weightInKg}*${setTable.repetitions})`,
            })
            .from(teamTable)
            .innerJoin(
              teamMemberTable,
              and(
                eq(teamMemberTable.teamId, teamTable.id),
                eq(teamMemberTable.userId, sql`"teamTable_members"."user_id"`),
              ),
            )
            .innerJoin(
              dashboardTable,
              eq(dashboardTable.userId, teamMemberTable.userId),
            )
            .innerJoin(tileTable, eq(tileTable.dashboardId, dashboardTable.id))
            .innerJoin(
              exerciseTable,
              eq(tileTable.exerciseId, exerciseTable.id),
            )
            .innerJoin(setTable, eq(setTable.exerciseId, exerciseTable.id))
            .where(eq(teamTable.id, teamId))})`
            .mapWith(Number)
            .as("total_weight_in_kg"),
        },
        with: {
          user: {
            columns: {
              name: true,
              email: true,
            },
          },
        },
      },
      events: {
        where: exists(memberInTeam),
        orderBy: desc(teamEventTable.createdAt),
        with: {
          reactions: {
            with: {
              user: {
                columns: {
                  name: true,
                },
              },
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
    .set({ name })
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

export const changeTeamMemberRole = async (
  userId: TeamMember["userId"],
  memberId: TeamMember["userId"],
  teamId: TeamMember["teamId"],
  role: TeamMember["role"],
  db: Db,
) => {
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

  const res = await db
    .update(teamMemberTable)
    .set({ role })
    .where(
      and(
        eq(teamMemberTable.userId, memberId),
        eq(teamMemberTable.teamId, teamId),
        exists(userIsAdmin),
      ),
    )
    .returning();

  if (!res.length) {
    throw new Error("Only admins can change a member role");
  }

  return res;
};

export const changeTeamVisibility = async (
  userId: TeamMember["userId"],
  teamId: Team["id"],
  visibility: Team["visibility"],
  db: Db,
) => {
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

  return db
    .update(teamTable)
    .set({ visibility })
    .where(and(eq(teamTable.id, teamId), exists(userIsAdmin)));
};

export const generateTeamInvitationToken = () => {
  const bytes = randomBytes(20);

  return bytes.toString("base64url");
};

export const createTeamInvitation = async (
  email: TeamInvitation["email"],
  inviterId: TeamInvitation["inviterId"],
  teamId: TeamInvitation["teamId"],
  token: TeamInvitation["token"],
  db: Db,
) => {
  const inviter = await db.query.teamMemberTable.findFirst({
    where: and(
      eq(teamMemberTable.teamId, teamId),
      eq(teamMemberTable.userId, inviterId),
      eq(teamMemberTable.role, "admin"),
    ),
  });

  if (!inviter) {
    throw new Error("only admins are allowed to invite new members");
  }

  return db
    .insert(teamInvitationTable)
    .values({
      email,
      inviterId,
      teamId,
      token,
    })
    .onConflictDoUpdate({
      target: [teamInvitationTable.teamId, teamInvitationTable.email],
      set: {
        token,
        status: "pending",
        expiresAt: addDate(new Date(), 7),
        createdAt: new Date(),
      },
      targetWhere: eq(teamInvitationTable.status, "pending"),
    });
};

export const selectMemberInTeamByEmail = async (
  email: User["email"],
  teamId: TeamMember["teamId"],
  db: Db,
) => {
  const [member] = await db
    .select()
    .from(userTable)
    .innerJoin(
      teamMemberTable,
      and(
        eq(teamMemberTable.userId, userTable.id),
        eq(teamMemberTable.teamId, teamId),
      ),
    )
    .where(eq(userTable.email, email));

  return member;
};

export const selectMemberInTeamById = async (
  memberId: TeamMember["userId"],
  teamId: TeamMember["teamId"],
  db: Db,
) => {
  const [member] = await db
    .select()
    .from(teamMemberTable)
    .where(
      and(
        eq(teamMemberTable.userId, memberId),
        eq(teamMemberTable.teamId, teamId),
      ),
    );

  return member;
};

export const revokeTeamInvitation = async (
  userId: TeamMember["userId"],
  invitationId: TeamInvitation["id"],
  db: Db,
) => {
  const userIsAdmin = db
    .select()
    .from(teamInvitationTable)
    .innerJoin(
      teamMemberTable,
      and(
        eq(teamMemberTable.teamId, teamInvitationTable.teamId),
        eq(teamMemberTable.userId, userId),
        eq(teamMemberTable.role, "admin"),
      ),
    )
    .where(eq(teamInvitationTable.id, invitationId));

  return db
    .update(teamInvitationTable)
    .set({ status: "revoked" })
    .where(and(eq(teamInvitationTable.id, invitationId), exists(userIsAdmin)));
};

export const selectTeamInvitationByToken = async (
  token: TeamInvitation["token"],
  db: Db,
) => {
  return db.query.teamInvitationTable.findFirst({
    where: and(
      eq(teamInvitationTable.token, token),
      eq(teamInvitationTable.status, "pending"),
    ),
  });
};

export const expireTeamInvitation = async (
  invitationId: TeamInvitation["id"],
  db: Db,
) => {
  return db
    .update(teamInvitationTable)
    .set({ status: "expired" })
    .where(and(eq(teamInvitationTable.id, invitationId)));
};

export const acceptInvitation = async (
  invitationId: TeamInvitation["id"],
  db: Db,
) => {
  return db
    .update(teamInvitationTable)
    .set({ status: "accepted" })
    .where(and(eq(teamInvitationTable.id, invitationId)));
};

export const createTeamJoinRequest = async (
  userId: TeamJoinRequest["userId"],
  teamId: TeamJoinRequest["teamId"],
  db: Db,
) => {
  return db
    .insert(teamJoinRequestTable)
    .values({ teamId, userId })
    .onConflictDoUpdate({
      target: [teamJoinRequestTable.teamId, teamJoinRequestTable.userId],
      set: {
        status: "pending",
      },
    });
};

export const rejectTeamJoinRequest = async (
  joinRequestId: TeamJoinRequest["id"],
  userId: TeamMember["userId"],
  db: Db,
) => {
  const userIsAdmin = db
    .select()
    .from(teamJoinRequestTable)
    .innerJoin(
      teamMemberTable,
      and(
        eq(teamMemberTable.teamId, teamJoinRequestTable.teamId),
        eq(teamMemberTable.userId, userId),
        eq(teamMemberTable.role, "admin"),
      ),
    )
    .where(eq(teamJoinRequestTable.id, joinRequestId));

  const [joinRequest] = await db
    .update(teamJoinRequestTable)
    .set({ status: "rejected" })
    .where(and(eq(teamJoinRequestTable.id, joinRequestId), exists(userIsAdmin)))
    .returning();

  if (!joinRequest) {
    throw new Error("only admin can reject team request");
  }
};

export const acceptTeamJoinRequest = async (
  joinRequestId: TeamJoinRequest["id"],
  userId: TeamMember["userId"],
  db: Db,
) => {
  const userIsAdmin = db
    .select()
    .from(teamJoinRequestTable)
    .innerJoin(
      teamMemberTable,
      and(
        eq(teamMemberTable.teamId, teamJoinRequestTable.teamId),
        eq(teamMemberTable.userId, userId),
        eq(teamMemberTable.role, "admin"),
      ),
    )
    .where(eq(teamJoinRequestTable.id, joinRequestId));

  const [joinRequest] = await db
    .update(teamJoinRequestTable)
    .set({ status: "accepted" })
    .where(and(eq(teamJoinRequestTable.id, joinRequestId), exists(userIsAdmin)))
    .returning();

  if (!joinRequest) {
    throw new Error("only admin can accept team request");
  }

  return joinRequest;
};

export const createTeamsEvents = async (
  values: Array<typeof teamEventTable.$inferInsert>,
  db: Db,
) => {
  return db.insert(teamEventTable).values(values);
};

export const selectTeamsByMemberId = async (
  userId: TeamMember["userId"],
  db: Db,
) => {
  return db
    .select(getTableColumns(teamTable))
    .from(teamMemberTable)
    .innerJoin(teamTable, eq(teamTable.id, teamMemberTable.teamId))
    .where(eq(teamMemberTable.userId, userId));
};

export const createTeamEventReaction = async (
  teamEventId: TeamEventReaction["teamEventId"],
  userId: TeamEventReaction["userId"],
  emoji: TeamEventReaction["emoji"],
  db: Db,
) => {
  const userInTeam = await db
    .select()
    .from(teamEventTable)
    .innerJoin(teamTable, eq(teamTable.id, teamEventTable.teamId))
    .innerJoin(
      teamMemberTable,
      and(
        eq(teamMemberTable.teamId, teamTable.id),
        eq(teamMemberTable.userId, userId),
      ),
    )
    .where(eq(teamEventTable.id, teamEventId));

  if (!userInTeam.length) {
    throw new Error("User is not a member of the team for this event");
  }

  return db.insert(teamEventReactionTable).values({
    emoji,
    teamEventId,
    userId,
  });
};

export const removeTeamEventReaction = async (
  teamEventId: TeamEventReaction["teamEventId"],
  userId: TeamEventReaction["userId"],
  emoji: TeamEventReaction["emoji"],
  db: Db,
) => {
  const userInTeam = db
    .select()
    .from(teamEventTable)
    .innerJoin(teamTable, eq(teamTable.id, teamEventTable.teamId))
    .innerJoin(
      teamMemberTable,
      and(
        eq(teamMemberTable.teamId, teamTable.id),
        eq(teamMemberTable.userId, userId),
      ),
    )
    .where(eq(teamEventTable.id, teamEventId));

  const res = await db
    .delete(teamEventReactionTable)
    .where(
      and(
        eq(teamEventReactionTable.emoji, emoji),
        eq(teamEventReactionTable.teamEventId, teamEventId),
        eq(teamEventReactionTable.userId, userId),
        exists(userInTeam),
      ),
    )
    .returning();

  if (!res.length) {
    throw new Error("User is not a member of the team for this event");
  }

  return res;
};
