import { sql } from "drizzle-orm";
import { pgEnum, pgTable } from "drizzle-orm/pg-core";
import { UserSchema } from "@gym-graphs/shared/schemas/user";

export const weightUnitEnum = pgEnum(
  "weight_unit",
  UserSchema.fields.weightUnit.literals,
);

export const oneRepMaxAlgoEnum = pgEnum(
  "one_rep_max_algo",
  UserSchema.fields.oneRepMaxAlgo.literals,
);

export const dashboardViewEnum = pgEnum(
  "dashboard_view",
  UserSchema.fields.dashboardView.literals,
);

export const users = pgTable("users", (t) => ({
  id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
  email: t.text("email").notNull().unique(),
  name: t.text("name").notNull(),
  password: t.text("password"),
  salt: t.text("salt"),
  weightUnit: weightUnitEnum().notNull().default("kg"),
  oneRepMaxAlgo: oneRepMaxAlgoEnum().notNull().default("epley"),
  dashboardView: dashboardViewEnum().notNull().default("graph"),
  verifiedAt: t.timestamp("verified_at"),
  createdAt: t.timestamp("created_at").notNull().defaultNow(),
  updatedAt: t
    .timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}));

export type User = Readonly<typeof users.$inferSelect>;

export const sessions = pgTable("sessions", (t) => ({
  id: t.text("id").notNull().primaryKey(),
  userId: t
    .integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
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

export type Session = Readonly<typeof sessions.$inferSelect>;

export const verificationCodes = pgTable("verification_codes", (t) => ({
  id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
  code: t.text("code").notNull(),
  userId: t
    .integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
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
}));

export type VerificationCode = Readonly<typeof verificationCodes.$inferSelect>;

export const passwordResetTokens = pgTable("password_reset_tokens", (t) => ({
  token: t.text("token").notNull().primaryKey(),
  userId: t
    .integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
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
  typeof passwordResetTokens.$inferSelect
>;
