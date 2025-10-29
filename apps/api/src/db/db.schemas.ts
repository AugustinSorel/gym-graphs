import { relations, sql } from "drizzle-orm";
import { pgEnum, pgTable, primaryKey, unique } from "drizzle-orm/pg-core";
import { constant } from "@gym-graphs/constants";

export const weightUnitEnum = pgEnum("weight_unit", constant.user.weightUnit);

export const oneRepMaxAlgoEnum = pgEnum(
  "one_rep_max_algo",
  constant.user.oneRepMaxAlgo,
);

export const dashboardViewEnum = pgEnum(
  "dashboard_view",
  constant.user.dashboardView,
);

export const userTable = pgTable("user", (t) => ({
  id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
  email: t.text("email").notNull().unique(),
  name: t.text("name").notNull(),
  password: t.text("password"),
  salt: t.text("salt"),
  weightUnit: weightUnitEnum().notNull().default("kg"),
  oneRepMaxAlgo: oneRepMaxAlgoEnum().notNull().default("epley"),
  dashboardView: dashboardViewEnum().notNull().default("graph"),
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

export const tileTypeEnum = pgEnum("tile_type", constant.dashboard.tile.types);

export const tileTable = pgTable(
  "tile",
  (t) => ({
    id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
    index: t.serial("index"),
    name: t.text("name").notNull(),
    dashboardId: t
      .integer("dashboard_id")
      .references(() => dashboardTable.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: t.timestamp("created_at").notNull().defaultNow(),
    updatedAt: t
      .timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  }),
  (t) => [unique().on(t.name, t.dashboardId)],
);

export type Tile = Readonly<typeof tileTable.$inferSelect>;

export const tileRelations = relations(tileTable, ({ one, many }) => ({
  dashboard: one(dashboardTable, {
    fields: [tileTable.dashboardId],
    references: [dashboardTable.id],
  }),
  exerciseOverview: one(exerciseOverviewTileTable),
  exerciseSetCount: one(exerciseSetCountTileTable),
  exerciseTagCount: one(exerciseTagCountTileTable),
  dashboardHeatMap: one(dashboardHeatMapTileTable),
  dashboardFunFacts: one(dashboardFunFactsTileTable),
  tileToTags: many(tilesToTagsTableTable),
}));

export const exerciseOverviewTileTable = pgTable(
  "exercise_overview_tile",
  (t) => ({
    id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
    tileId: t
      .integer("tile_id")
      .references(() => tileTable.id, { onDelete: "cascade" })
      .notNull(),
    exerciseId: t
      .integer("exercise_id")
      .references(() => exerciseTable.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: t.timestamp("created_at").notNull().defaultNow(),
    updatedAt: t
      .timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  }),
);

export type ExerciseOverviewTile = Readonly<
  typeof exerciseOverviewTileTable.$inferSelect
>;

export const exerciseOverviewTileRelations = relations(
  exerciseOverviewTileTable,
  ({ one }) => ({
    tile: one(tileTable, {
      fields: [exerciseOverviewTileTable.tileId],
      references: [tileTable.id],
    }),
    exercise: one(exerciseTable, {
      fields: [exerciseOverviewTileTable.exerciseId],
      references: [exerciseTable.id],
    }),
  }),
);

export const exerciseSetCountTileTable = pgTable(
  "exercise_set_count_tile",
  (t) => ({
    id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
    tileId: t
      .integer("tile_id")
      .references(() => tileTable.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: t.timestamp("created_at").notNull().defaultNow(),
    updatedAt: t
      .timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  }),
);

export type ExerciseSetCountTile = Readonly<
  typeof exerciseSetCountTileTable.$inferSelect
>;

export const exerciseSetCountTileRelations = relations(
  exerciseSetCountTileTable,
  ({ one }) => ({
    tile: one(tileTable, {
      fields: [exerciseSetCountTileTable.tileId],
      references: [tileTable.id],
    }),
  }),
);

export const exerciseTagCountTileTable = pgTable(
  "exercise_tag_count_tile",
  (t) => ({
    id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
    tileId: t
      .integer("tile_id")
      .references(() => tileTable.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: t.timestamp("created_at").notNull().defaultNow(),
    updatedAt: t
      .timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  }),
);

export type ExerciseTagCountTile = Readonly<
  typeof exerciseTagCountTileTable.$inferSelect
>;

export const exerciseTagCountTileRelations = relations(
  exerciseTagCountTileTable,
  ({ one }) => ({
    tile: one(tileTable, {
      fields: [exerciseTagCountTileTable.tileId],
      references: [tileTable.id],
    }),
  }),
);

export const dashboardHeatMapTileTable = pgTable(
  "dashboard_heat_map_tile",
  (t) => ({
    id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
    tileId: t
      .integer("tile_id")
      .references(() => tileTable.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: t.timestamp("created_at").notNull().defaultNow(),
    updatedAt: t
      .timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  }),
);

export type DashboardHeatMapTile = Readonly<
  typeof dashboardHeatMapTileTable.$inferSelect
>;

export const dashboardHeatMapTileRelations = relations(
  dashboardHeatMapTileTable,
  ({ one }) => ({
    tile: one(tileTable, {
      fields: [dashboardHeatMapTileTable.tileId],
      references: [tileTable.id],
    }),
  }),
);

export const dashboardFunFactsTileTable = pgTable(
  "dashboard_fun_facts_tile",
  (t) => ({
    id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
    tileId: t
      .integer("tile_id")
      .references(() => tileTable.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: t.timestamp("created_at").notNull().defaultNow(),
    updatedAt: t
      .timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  }),
);

export type DashboardFunFactsTile = Readonly<
  typeof dashboardHeatMapTileTable.$inferSelect
>;

export const dashboardFunFactsTileRelations = relations(
  dashboardFunFactsTileTable,
  ({ one }) => ({
    tile: one(tileTable, {
      fields: [dashboardFunFactsTileTable.tileId],
      references: [tileTable.id],
    }),
  }),
);

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

export type OAuthAccount = Readonly<typeof oauthAccountTable.$inferSelect>;

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
  exerciseOverviewTile: one(exerciseOverviewTileTable, {
    fields: [exerciseTable.id],
    references: [exerciseOverviewTileTable.exerciseId],
  }),
}));

export const setTable = pgTable("set", (t) => ({
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
}));

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

export type TilesToTags = Readonly<typeof tilesToTagsTableTable.$inferSelect>;

export const tilesToTagsRelations = relations(
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
