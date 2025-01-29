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
} from "drizzle-orm/pg-core";
import { dashboardTileSchema } from "~/user/user.schemas";
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
  exercises: many(exerciseTable),
  tags: many(tagTable),
  oauthAccounts: many(oauthAccountTable),
  dashboardTiles: many(dashboardTileTable),
}));

export const dashboardTileTypeEnum = pgEnum(
  "dashboard_tile_type",
  dashboardTileSchema.shape.type.options,
);

export const dashboardTileTable = pgTable("dashboard_tile", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  type: dashboardTileTypeEnum().notNull(),
  index: serial("index"),
  userId: integer("user_id")
    .notNull()
    .references(() => userTable.id, { onDelete: "cascade" }),
  exerciseId: integer("exercise_id").references(() => exerciseTable.id, {
    onDelete: "cascade",
  }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type DashboardTile = Readonly<typeof dashboardTileTable.$inferSelect>;

export const dashboardItemRelations = relations(
  dashboardTileTable,
  ({ one }) => ({
    user: one(userTable, {
      fields: [dashboardTileTable.userId],
      references: [userTable.id],
    }),
    exercise: one(exerciseTable),
  }),
);

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

//BUG: unique constraint does not work with new drizzle sintax
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
  (table) => ({
    pk: primaryKey({ columns: [table.providerId, table.providerUserId] }),
  }),
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

//BUG: unique constraint does not work with new drizzle sintax
export const exerciseTable = pgTable(
  "exercise",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    name: text("").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    unq: unique().on(table.userId, table.name),
  }),
);

export type Exercise = Readonly<typeof exerciseTable.$inferSelect>;

export const exerciseRelations = relations(exerciseTable, ({ one, many }) => ({
  user: one(userTable, {
    fields: [exerciseTable.userId],
    references: [userTable.id],
  }),
  sets: many(setTable),
  tags: many(exerciseTagTable),
  dashboardTile: one(dashboardTileTable, {
    fields: [exerciseTable.id],
    references: [dashboardTileTable.exerciseId],
  }),
}));

//BUG: unique constraint does not work with new drizzle sintax
export const setTable = pgTable(
  "set",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    exerciseId: integer("exercise_id")
      .notNull()
      .references(() => exerciseTable.id, { onDelete: "cascade" }),
    weightInKg: integer("weight_in_kg").notNull(),
    repetitions: integer("repetition_count").notNull(),
    doneAt: date("done_at", { mode: "date" }).notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    unq: unique().on(table.doneAt, table.exerciseId),
  }),
);

export type Set = Readonly<typeof setTable.$inferSelect>;

export const setRelations = relations(setTable, ({ one }) => ({
  exercise: one(exerciseTable, {
    fields: [setTable.exerciseId],
    references: [exerciseTable.id],
  }),
}));

//BUG: unique constraint does not work with new drizzle sintax
export const exerciseTagTable = pgTable(
  "exercise_tag",
  {
    exerciseId: integer("exercise_id")
      .notNull()
      .references(() => exerciseTable.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tagTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.exerciseId, table.tagId] }),
  }),
);

export const exerciseTagRelations = relations(exerciseTagTable, ({ one }) => ({
  exercise: one(exerciseTable, {
    fields: [exerciseTagTable.exerciseId],
    references: [exerciseTable.id],
  }),
  tag: one(tagTable, {
    fields: [exerciseTagTable.tagId],
    references: [tagTable.id],
  }),
}));

//BUG: unique constraint does not work with new drizzle sintax
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
  (table) => ({
    unq: unique().on(table.name, table.userId),
  }),
);

export type Tag = Readonly<typeof tagTable.$inferSelect>;

export const tagRelations = relations(tagTable, ({ one, many }) => ({
  user: one(userTable, {
    fields: [tagTable.userId],
    references: [userTable.id],
  }),
  exercises: many(exerciseTagTable),
}));
