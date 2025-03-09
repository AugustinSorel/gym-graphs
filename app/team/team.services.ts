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
  isNull,
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
  teamEventNotificationTable,
} from "~/db/db.schemas";
import { addDate } from "~/utils/date";
import { randomBytes } from "crypto";
import {
  TeamDuplicateError,
  TeamEventReactionNotFoundError,
  TeamInvitationAdminInviterError,
  TeamInvitationNotFoundError,
  TeamJoinRequestAcceptPrivilegeError,
  TeamJoinRequestRejectPrivilegeError,
  TeamMemberNotFoundError,
  TeamNotFoundError,
} from "~/team/team.errors";
import type { Db } from "~/libs/db";
import type {
  Team,
  TeamEventReaction,
  TeamInvitation,
  TeamJoinRequest,
  TeamMember,
  TeamEventNotification,
  User,
  Tile,
} from "~/db/db.schemas";

export const createTeam = async (
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
      throw new TeamNotFoundError();
    }

    return team;
  } catch (e) {
    if (TeamDuplicateError.check(e)) {
      throw TeamDuplicateError();
    }

    throw e;
  }
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

export const createTeamMember = async (
  teamId: TeamMember["teamId"],
  userId: TeamMember["userId"],
  role: TeamMember["role"],
  db: Db,
) => {
  const [member] = await db
    .insert(teamMemberTable)
    .values({
      teamId,
      userId,
      role,
    })
    .returning();

  if (!member) {
    throw new TeamMemberNotFoundError();
  }

  return member;
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
              sum: sql`coalesce(sum(${setTable.weightInKg}*${setTable.repetitions}), 0)`,
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
          notifications: {
            where: and(
              isNull(teamEventNotificationTable.readAt),
              eq(teamEventNotificationTable.userId, memberId),
            ),
          },
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
  try {
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

    const [team] = await db
      .update(teamTable)
      .set({ name })
      .where(and(eq(teamTable.id, teamId), exists(adminUserInTeam)))
      .returning();

    if (!team) {
      throw new TeamNotFoundError();
    }

    return team;
  } catch (e) {
    if (TeamDuplicateError.check(e)) {
      throw new TeamDuplicateError();
    }

    throw e;
  }
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

  const [team] = await db
    .delete(teamTable)
    .where(and(eq(teamTable.id, teamId), exists(adminUserInTeam)))
    .returning();

  if (!team) {
    throw new TeamNotFoundError();
  }

  return team;
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

  const [member] = await db
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

  if (!member) {
    throw new TeamMemberNotFoundError();
  }

  return member;
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

  const [member] = await db
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

  if (!member) {
    throw new TeamMemberNotFoundError();
  }

  return member;
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

  const [member] = await db
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

  if (!member) {
    throw new TeamMemberNotFoundError();
  }

  return member;
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

  const [team] = await db
    .update(teamTable)
    .set({ visibility })
    .where(and(eq(teamTable.id, teamId), exists(userIsAdmin)))
    .returning();

  if (!team) {
    throw new TeamNotFoundError();
  }

  return team;
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
  const adminInviter = await db.query.teamMemberTable.findFirst({
    where: and(
      eq(teamMemberTable.teamId, teamId),
      eq(teamMemberTable.userId, inviterId),
      eq(teamMemberTable.role, "admin"),
    ),
  });

  if (!adminInviter) {
    throw new TeamInvitationAdminInviterError();
  }

  const [invitation] = await db
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
    })
    .returning();

  if (!invitation) {
    throw new TeamInvitationNotFoundError();
  }

  return invitation;
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

export const selectTeamWithMembers = async (teamId: Team["id"], db: Db) => {
  return db.query.teamTable.findFirst({
    where: eq(teamTable.id, teamId),
    with: {
      members: {
        with: {
          user: {
            columns: {
              email: true,
            },
          },
        },
      },
    },
  });
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

  const [teamInvitation] = await db
    .update(teamInvitationTable)
    .set({ status: "revoked" })
    .where(and(eq(teamInvitationTable.id, invitationId), exists(userIsAdmin)))
    .returning();

  if (!teamInvitation) {
    throw new TeamInvitationNotFoundError();
  }

  return teamInvitation;
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
  const [teamInvitation] = await db
    .update(teamInvitationTable)
    .set({ status: "expired" })
    .where(and(eq(teamInvitationTable.id, invitationId)))
    .returning();

  if (!teamInvitation) {
    throw new TeamInvitationNotFoundError();
  }

  return teamInvitation;
};

export const acceptInvitation = async (
  invitationId: TeamInvitation["id"],
  db: Db,
) => {
  const [teamInvitation] = await db
    .update(teamInvitationTable)
    .set({ status: "accepted" })
    .where(and(eq(teamInvitationTable.id, invitationId)))
    .returning();

  if (!teamInvitation) {
    throw new TeamInvitationNotFoundError();
  }

  return teamInvitation;
};

export const createTeamJoinRequest = async (
  userId: TeamJoinRequest["userId"],
  teamId: TeamJoinRequest["teamId"],
  db: Db,
) => {
  const [joinRequest] = await db
    .insert(teamJoinRequestTable)
    .values({ teamId, userId })
    .onConflictDoUpdate({
      target: [teamJoinRequestTable.teamId, teamJoinRequestTable.userId],
      setWhere: ne(teamJoinRequestTable.status, "pending"),
      set: {
        status: "pending",
      },
    })
    .returning();

  return joinRequest;
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
    throw new TeamJoinRequestRejectPrivilegeError();
  }

  return joinRequest;
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
    throw new TeamJoinRequestAcceptPrivilegeError();
  }

  return joinRequest;
};

export const createTeamsEvents = async (
  values: Array<typeof teamEventTable.$inferInsert>,
  db: Db,
) => {
  return db.insert(teamEventTable).values(values).returning();
};

export const selectTeamMembershipsByMemberId = async (
  userId: TeamMember["userId"],
  db: Db,
) => {
  return db.query.teamMemberTable.findMany({
    where: eq(teamMemberTable.userId, userId),
    with: {
      team: {
        with: {
          members: true,
        },
      },
    },
  });
};

export const createTeamEventReaction = async (
  teamEventId: TeamEventReaction["teamEventId"],
  userId: TeamEventReaction["userId"],
  emoji: TeamEventReaction["emoji"],
  db: Db,
) => {
  const [userInTeam] = await db
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

  if (!userInTeam) {
    throw new TeamMemberNotFoundError();
  }

  const [reaction] = await db
    .insert(teamEventReactionTable)
    .values({ emoji, teamEventId, userId })
    .returning();

  if (!reaction) {
    throw new TeamEventReactionNotFoundError();
  }

  return reaction;
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

  const [reaction] = await db
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

  if (!reaction) {
    throw new TeamEventReactionNotFoundError();
  }

  return reaction;
};

export const createTeamEventNotifications = async (
  values: Array<typeof teamEventNotificationTable.$inferInsert>,
  db: Db,
) => {
  return db.insert(teamEventNotificationTable).values(values);
};

export const readTeamEventNotifications = async (
  userId: TeamEventNotification["userId"],
  teamId: TeamEventNotification["teamId"],
  db: Db,
) => {
  return db
    .update(teamEventNotificationTable)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(teamEventNotificationTable.userId, userId),
        eq(teamEventNotificationTable.teamId, teamId),
      ),
    );
};

export const notifyTeamsFromNewOneRepMax = async (
  user: Pick<User, "id" | "name">,
  tileName: Tile["name"],
  newOneRepMax: number,
  db: Db,
) => {
  const teamMemberships = await selectTeamMembershipsByMemberId(user.id, db);

  if (!teamMemberships.length) {
    return;
  }

  await db.transaction(async (tx) => {
    const events = teamMemberships.map((teamMembership) => ({
      name: "new one-rep max achieved!",
      description: `${user.name} just crushed a new PR on ${tileName}: ${newOneRepMax}`,
      teamId: teamMembership.teamId,
    }));

    const eventsCreated = await createTeamsEvents(events, tx);

    const notifications = eventsCreated.flatMap((event, index) => {
      const teamMembership = teamMemberships.at(index);

      if (!teamMembership) {
        throw new TeamMemberNotFoundError();
      }

      return teamMembership.team.members
        .filter((member) => member.userId !== user.id)
        .map((member) => ({
          teamId: member.teamId,
          userId: member.userId,
          eventId: event.id,
        }));
    });

    await createTeamEventNotifications(notifications, tx);
  });
};
