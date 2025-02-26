import { relations, sql } from "drizzle-orm";
import { pgEnum, pgTable, primaryKey, unique } from "drizzle-orm/pg-core";
import { tileSchema } from "~/dashboard/dashboard.schemas";
import {
  teamInvitationSchema,
  teamJoinRequestSchema,
  teamMemberSchema,
  teamSchema,
} from "~/team/team.schemas";
import { userSchema } from "~/user/user.schemas";

export const weightUnitEnum = pgEnum(
  "weight_unit",
  userSchema.shape.weightUnit.options,
);

export const oneRepMaxAlgoEnum = pgEnum(
  "one_rep_max_algo",
  userSchema.shape.oneRepMaxAlgo.options,
);

export const userTable = pgTable("user", (t) => ({
  id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
  email: t.text("email").notNull().unique(),
  name: t.text("name").notNull(),
  password: t.text("password"),
  salt: t.text("salt"),
  weightUnit: weightUnitEnum().notNull().default("kg"),
  oneRepMaxAlgo: oneRepMaxAlgoEnum().notNull().default("epley"),
  emailVerifiedAt: t.timestamp("email_verified_at"),
  createdAt: t.timestamp("created_at").notNull().defaultNow(),
  updatedAt: t
    .timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}));

export type User = Readonly<typeof userTable.$inferSelect>;

export const userRelations = relations(userTable, ({ one, many }) => ({
  session: one(sessionTable, {
    fields: [userTable.id],
    references: [sessionTable.userId],
  }),
  emailVerificationCode: one(emailVerificationCodeTable),
  passwordResetToken: one(passwordResetTokenTable),
  tags: many(tagTable),
  oauthAccounts: many(oauthAccountTable),
  teams: many(teamMemberTable),
  teamInvitations: many(teamInvitationTable),
  teamJoinRequests: many(teamJoinRequestTable),
  dashboard: one(dashboardTable, {
    fields: [userTable.id],
    references: [dashboardTable.userId],
  }),
}));

export const dashboardTable = pgTable("dashboard", (t) => ({
  id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: t
    .integer("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" })
    .unique(),
  createdAt: t.timestamp("created_at").notNull().defaultNow(),
  updatedAt: t
    .timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}));

export type Dashboard = Readonly<typeof dashboardTable.$inferSelect>;

export const dashboardRelations = relations(
  dashboardTable,
  ({ one, many }) => ({
    user: one(userTable, {
      fields: [dashboardTable.userId],
      references: [userTable.id],
    }),
    tiles: many(tileTable),
  }),
);

export const tileTypeEnum = pgEnum("tile_type", tileSchema.shape.type.options);

export const tileTable = pgTable(
  "tile",
  (t) => ({
    id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
    type: tileTypeEnum().notNull(),
    index: t.serial("index"),
    name: t.text("name").notNull(),
    dashboardId: t
      .integer("dashboard_id")
      .references(() => dashboardTable.id, { onDelete: "cascade" })
      .notNull(),
    exerciseId: t.integer("exercise_id").references(() => exerciseTable.id, {
      onDelete: "cascade",
    }),
    createdAt: t.timestamp("created_at").notNull().defaultNow(),
    updatedAt: t
      .timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  }),
  (t) => [t.name, t.dashboardId],
);

export type Tile = Readonly<typeof tileTable.$inferSelect>;

export const tileRelations = relations(tileTable, ({ one, many }) => ({
  dashboard: one(dashboardTable, {
    fields: [tileTable.dashboardId],
    references: [dashboardTable.id],
  }),
  exercise: one(exerciseTable),
  tileToTags: many(tilesToTagsTableTable),
}));

export const emailVerificationCodeTable = pgTable(
  "email_verification_code",
  (t) => ({
    id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
    code: t.text("code").notNull(),
    userId: t
      .integer("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    expiresAt: t
      .timestamp("expires_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP + (15 * interval '1 min')`),
    createdAt: t.timestamp("created_at").notNull().defaultNow(),
    updatedAt: t
      .timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  }),
);

export type EmailVerificationCode = Readonly<
  typeof emailVerificationCodeTable.$inferSelect
>;

export const emailVerificationRelations = relations(
  emailVerificationCodeTable,
  ({ one }) => ({
    user: one(userTable, {
      fields: [emailVerificationCodeTable.userId],
      references: [userTable.id],
    }),
  }),
);

export const oauthProviders = pgEnum("oauth_provider", ["github"]);

export const oauthAccountTable = pgTable(
  "oauth_account",
  (t) => ({
    providerId: oauthProviders("provider_id").notNull(),
    providerUserId: t.text("provider_user_id").notNull(),
    userId: t
      .integer("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    createdAt: t.timestamp("created_at").defaultNow().notNull(),
    updatedAt: t
      .timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  }),
  (t) => [primaryKey({ columns: [t.providerId, t.providerUserId] })],
);

export type OauthAccount = Readonly<typeof oauthAccountTable.$inferSelect>;

export const oauthAccountRelations = relations(
  oauthAccountTable,
  ({ one }) => ({
    user: one(userTable, {
      fields: [oauthAccountTable.providerUserId],
      references: [userTable.id],
    }),
  }),
);

export const sessionTable = pgTable("session", (t) => ({
  id: t.text("id").notNull().primaryKey(),
  userId: t
    .integer("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  expiresAt: t
    .timestamp("expires_at", {
      mode: "date",
      withTimezone: true,
    })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP + (30 * interval '1 day')`),
  createdAt: t.timestamp("created_at").notNull().defaultNow(),
  updatedAt: t
    .timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}));

export type Session = Readonly<typeof sessionTable.$inferSelect>;

export const sessionRelations = relations(sessionTable, ({ one }) => ({
  user: one(userTable, {
    fields: [sessionTable.userId],
    references: [userTable.id],
  }),
}));

export const passwordResetTokenTable = pgTable("password_reset_token", (t) => ({
  token: t.text("token").notNull().primaryKey(),
  userId: t
    .integer("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  expiresAt: t
    .timestamp("expires_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP + (15 * interval '2 hour')`),
  createdAt: t.timestamp("created_at").notNull().defaultNow(),
  updatedAt: t
    .timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}));

export type PasswordResetToken = Readonly<
  typeof passwordResetTokenTable.$inferSelect
>;

export const resetPasswordRelations = relations(
  passwordResetTokenTable,
  ({ one }) => ({
    user: one(userTable, {
      fields: [passwordResetTokenTable.userId],
      references: [userTable.id],
    }),
  }),
);

export const exerciseTable = pgTable("exercise", (t) => ({
  id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
  createdAt: t.timestamp("created_at").notNull().defaultNow(),
  updatedAt: t
    .timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}));

export type Exercise = Readonly<typeof exerciseTable.$inferSelect>;

export const exerciseRelations = relations(exerciseTable, ({ one, many }) => ({
  sets: many(setTable),
  tile: one(tileTable, {
    fields: [exerciseTable.id],
    references: [tileTable.exerciseId],
  }),
}));

export const setTable = pgTable(
  "set",
  (t) => ({
    id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
    exerciseId: t
      .integer("exercise_id")
      .notNull()
      .references(() => exerciseTable.id, { onDelete: "cascade" }),
    weightInKg: t.integer("weight_in_kg").notNull(),
    repetitions: t.integer("repetitions").notNull(),
    doneAt: t.date("done_at", { mode: "date" }).notNull().defaultNow(),
    createdAt: t.timestamp("created_at").notNull().defaultNow(),
    updatedAt: t
      .timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  }),
  (t) => [unique().on(t.doneAt, t.exerciseId)],
);

export type Set = Readonly<typeof setTable.$inferSelect>;

export const setRelations = relations(setTable, ({ one }) => ({
  exercise: one(exerciseTable, {
    fields: [setTable.exerciseId],
    references: [exerciseTable.id],
  }),
}));

export const tilesToTagsTableTable = pgTable(
  "tile_to_tags",
  (t) => ({
    tileId: t
      .integer("tile_id")
      .notNull()
      .references(() => tileTable.id, { onDelete: "cascade" }),
    tagId: t
      .integer("tag_id")
      .notNull()
      .references(() => tagTable.id, { onDelete: "cascade" }),
    createdAt: t.timestamp("created_at").notNull().defaultNow(),
    updatedAt: t
      .timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  }),
  (t) => [primaryKey({ columns: [t.tileId, t.tagId] })],
);

export const exerciseTagRelations = relations(
  tilesToTagsTableTable,
  ({ one }) => ({
    tile: one(tileTable, {
      fields: [tilesToTagsTableTable.tileId],
      references: [tileTable.id],
    }),
    tag: one(tagTable, {
      fields: [tilesToTagsTableTable.tagId],
      references: [tagTable.id],
    }),
  }),
);

export const tagTable = pgTable(
  "tag",
  (t) => ({
    id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: t
      .integer("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    name: t.text("name").notNull(),
    createdAt: t.timestamp("created_at").notNull().defaultNow(),
    updatedAt: t
      .timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  }),
  (t) => [unique().on(t.name, t.userId)],
);

export type Tag = Readonly<typeof tagTable.$inferSelect>;

export const tagRelations = relations(tagTable, ({ one, many }) => ({
  user: one(userTable, {
    fields: [tagTable.userId],
    references: [userTable.id],
  }),
  tagToTiles: many(tilesToTagsTableTable),
}));

export const teamVisibilityEnum = pgEnum(
  "team_visibility",
  teamSchema.shape.visibility.options,
);

export const teamTable = pgTable("team", (t) => ({
  id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
  visibility: teamVisibilityEnum("visibility").notNull().default("private"),
  name: t.text("name").notNull().unique(),
  createdAt: t.timestamp("created_at").notNull().defaultNow(),
  updatedAt: t
    .timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}));

export type Team = Readonly<typeof teamTable.$inferSelect>;

export const teamRelations = relations(teamTable, ({ many }) => ({
  members: many(teamMemberTable),
  invitations: many(teamInvitationTable),
  joinRequests: many(teamJoinRequestTable),
}));

export const teamMemberRoleEnum = pgEnum(
  "team_member_role",
  teamMemberSchema.shape.role.options,
);

export const teamMemberTable = pgTable(
  "team_member",
  (t) => ({
    userId: t
      .integer("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    teamId: t
      .integer("team_id")
      .notNull()
      .references(() => teamTable.id, { onDelete: "cascade" }),
    role: teamMemberRoleEnum("role").notNull().default("member"),
    createdAt: t.timestamp("created_at").notNull().defaultNow(),
    updatedAt: t
      .timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  }),
  (t) => [primaryKey({ columns: [t.userId, t.teamId] })],
);

export type TeamMember = Readonly<typeof teamMemberTable.$inferSelect>;

export const teamMemberRelations = relations(teamMemberTable, ({ one }) => ({
  user: one(userTable, {
    fields: [teamMemberTable.userId],
    references: [userTable.id],
  }),
  team: one(teamTable, {
    fields: [teamMemberTable.teamId],
    references: [teamTable.id],
  }),
}));

export const teamInvitationStatusEnum = pgEnum(
  "team_invitation_status",
  teamInvitationSchema.shape.status.options,
);

export const teamInvitationTable = pgTable(
  "team_invitation",
  (t) => ({
    id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
    teamId: t
      .integer("team_id")
      .notNull()
      .references(() => teamTable.id, { onDelete: "cascade" }),
    inviterId: t
      .integer("inviter_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    email: t.text("email").notNull(),
    token: t.text("token").notNull().unique(),
    status: teamInvitationStatusEnum("status").notNull().default("pending"),
    expiresAt: t
      .timestamp("expires_at")
      .default(sql`CURRENT_TIMESTAMP + (7 * interval '1 day')`)
      .notNull(),
    createdAt: t.timestamp("created_at").notNull().defaultNow(),
    updatedAt: t
      .timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  }),
  (t) => [unique().on(t.teamId, t.email)],
);

export type TeamInvitation = Readonly<typeof teamInvitationTable.$inferSelect>;

export const teamInvitationRelations = relations(
  teamInvitationTable,
  ({ one }) => ({
    inviter: one(userTable, {
      fields: [teamInvitationTable.inviterId],
      references: [userTable.id],
    }),
    team: one(teamTable, {
      fields: [teamInvitationTable.teamId],
      references: [teamTable.id],
    }),
  }),
);

export const teamJoinRequestStatusEnum = pgEnum(
  "team_join_request_status",
  teamJoinRequestSchema.shape.status.options,
);

export const teamJoinRequestTable = pgTable(
  "team_join_request",
  (t) => ({
    id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
    teamId: t
      .integer("team_id")
      .notNull()
      .references(() => teamTable.id, { onDelete: "cascade" }),
    userId: t
      .integer("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    status: teamJoinRequestStatusEnum("status").notNull().default("pending"),
    createdAt: t.timestamp("created_at").notNull().defaultNow(),
    updatedAt: t
      .timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  }),
  (t) => [unique().on(t.teamId, t.userId)],
);

export type TeamJoinRequest = Readonly<
  typeof teamJoinRequestTable.$inferSelect
>;

export const teamJoinRequestRelations = relations(
  teamJoinRequestTable,
  ({ one }) => ({
    user: one(userTable, {
      fields: [teamJoinRequestTable.userId],
      references: [userTable.id],
    }),
    team: one(teamTable, {
      fields: [teamJoinRequestTable.teamId],
      references: [teamTable.id],
    }),
  }),
);
