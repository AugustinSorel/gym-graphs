import { relations, sql } from "drizzle-orm";
import {
  integer,
  timestamp,
  text,
  unique,
  date,
  pgEnum,
  primaryKey,
  pgTable,
  serial,
  boolean,
} from "drizzle-orm/pg-core";
import { tileSchema } from "~/dashboard/dashboard.schemas";
import { userSchema } from "~/user/user.schemas";

export const weightUnitEnum = pgEnum(
  "weight_unit",
  userSchema.shape.weightUnit.options,
);

export const oneRepMaxAlgoEnum = pgEnum(
  "one_rep_max_algo",
  userSchema.shape.oneRepMaxAlgo.options,
);

export const userTable = pgTable("user", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  password: text("password"),
  weightUnit: weightUnitEnum().notNull().default("kg"),
  oneRepMaxAlgo: oneRepMaxAlgoEnum().notNull().default("epley"),
  emailVerifiedAt: timestamp("email_verified_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

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

export const dashboardTable = pgTable("dashboard", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" })
    .unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

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
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    type: tileTypeEnum().notNull(),
    index: serial("index"),
    name: text("name").notNull(),
    dashboardId: integer("dashboard_id")
      .references(() => dashboardTable.id, { onDelete: "cascade" })
      .notNull(),
    exerciseId: integer("exercise_id").references(() => exerciseTable.id, {
      onDelete: "cascade",
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [table.name, table.dashboardId],
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

export const emailVerificationCodeTable = pgTable("email_verification_code", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  code: text("code").notNull(),
  userId: integer("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP + (15 * interval '1 min')`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

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
  {
    providerId: oauthProviders("provider_id").notNull(),
    providerUserId: text("provider_user_id").notNull(),
    userId: integer("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.providerId, table.providerUserId] }),
  ],
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

export const sessionTable = pgTable("session", {
  id: text("id").notNull().primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", {
    mode: "date",
    withTimezone: true,
  })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP + (30 * interval '1 day')`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Session = Readonly<typeof sessionTable.$inferSelect>;

export const sessionRelations = relations(sessionTable, ({ one }) => ({
  user: one(userTable, {
    fields: [sessionTable.userId],
    references: [userTable.id],
  }),
}));

export const passwordResetTokenTable = pgTable("password_reset_token", {
  token: text("token").notNull().primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP + (15 * interval '2 hour')`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

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

export const exerciseTable = pgTable("exercise", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

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
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    exerciseId: integer("exercise_id")
      .notNull()
      .references(() => exerciseTable.id, { onDelete: "cascade" }),
    weightInKg: integer("weight_in_kg").notNull(),
    repetitions: integer("repetitions").notNull(),
    doneAt: date("done_at", { mode: "date" }).notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [unique().on(table.doneAt, table.exerciseId)],
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
  {
    tileId: integer("tile_id")
      .notNull()
      .references(() => tileTable.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tagTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.tileId, table.tagId] })],
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
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [unique().on(table.name, table.userId)],
);

export type Tag = Readonly<typeof tagTable.$inferSelect>;

export const tagRelations = relations(tagTable, ({ one, many }) => ({
  user: one(userTable, {
    fields: [tagTable.userId],
    references: [userTable.id],
  }),
  tagToTiles: many(tilesToTagsTableTable),
}));

export const teamTable = pgTable("team", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  isPublic: boolean("is_public").notNull().default(false),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Team = Readonly<typeof teamTable.$inferSelect>;

export const teamRelations = relations(teamTable, ({}) => ({}));
