import { sql } from "drizzle-orm";
import { pgEnum, pgTable, primaryKey, unique } from "drizzle-orm/pg-core";
import { UserSchema } from "@gym-graphs/shared/user/schemas";

export const weightUnitEnum = pgEnum(
  "weight_unit",
  UserSchema.fields.weightUnit.literals,
);

export const oneRepMaxAlgoEnum = pgEnum(
  "one_rep_max_algo",
  UserSchema.fields.oneRepMaxAlgo.literals,
);

export const users = pgTable("users", (t) => ({
  id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
  email: t.text("email").notNull().unique(),
  name: t.text("name").notNull(),
  password: t.text("password"),
  salt: t.text("salt"),
  weightUnit: weightUnitEnum().notNull().default("kg"),
  oneRepMaxAlgo: oneRepMaxAlgoEnum().notNull().default("epley"),
  verifiedAt: t.timestamp("verified_at"),
  createdAt: t.timestamp("created_at").notNull().defaultNow(),
  updatedAt: t
    .timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}));


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


export const oauthProviders = pgEnum("oauth_provider", ["github"]);

export const oauthAccounts = pgTable(
  "oauth_accounts",
  (t) => ({
    providerId: oauthProviders("provider_id").notNull(),
    providerUserId: t.text("provider_user_id").notNull(),
    userId: t
      .integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: t.timestamp("created_at").defaultNow().notNull(),
    updatedAt: t
      .timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  }),
  (t) => [primaryKey({ columns: [t.providerId, t.providerUserId] })],
);


export const tags = pgTable(
  "tag",
  (t) => ({
    id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: t
      .integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
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


export const exercisesToTags = pgTable(
  "exercises_to_tags",
  (t) => ({
    exerciseId: t
      .integer("exercise_id")
      .notNull()
      .references(() => exercises.id, { onDelete: "cascade" }),
    tagId: t
      .integer("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    createdAt: t.timestamp("created_at").notNull().defaultNow(),
    updatedAt: t
      .timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  }),
  (t) => [primaryKey({ columns: [t.exerciseId, t.tagId] })],
);


export const exercises = pgTable("exercises", (t) => ({
  id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: t
    .integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: t.text("name").notNull(),
  index: t.serial("index"),
  createdAt: t.timestamp("created_at").notNull().defaultNow(),
  updatedAt: t
    .timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}));


export const sets = pgTable("sets", (t) => ({
  id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
  exerciseId: t
    .integer("exercise_id")
    .notNull()
    .references(() => exercises.id, { onDelete: "cascade" }),
  weightInMg: t.integer("weight_in_mg").notNull(),
  repetitions: t.integer("repetitions").notNull(),
  doneAt: t.timestamp("done_at", { mode: "date" }).notNull().defaultNow(),
  createdAt: t.timestamp("created_at").notNull().defaultNow(),
  updatedAt: t
    .timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}));

