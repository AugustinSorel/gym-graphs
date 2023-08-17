import {
  timestamp,
  pgTable,
  text,
  primaryKey,
  integer,
  uuid,
  unique,
  serial,
  real,
  date,
} from "drizzle-orm/pg-core";
import type { AdapterAccount } from "@auth/core/adapters";
import { relations, type InferModel } from "drizzle-orm";
//FIXME: create different files

export const users = pgTable("user", {
  id: text("id").notNull().primaryKey(),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccount["type"]>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey(account.provider, account.providerAccountId),
  })
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").notNull().primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey(vt.identifier, vt.token),
  })
);

export const exercises = pgTable(
  "exercise",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (exercise) => ({
    unq: unique().on(exercise.userId, exercise.name),
  })
);

export const exercsiesRelations = relations(exercises, ({ many, one }) => ({
  data: many(exercisesData),
  position: one(exerciseGridPosition, {
    fields: [exercises.id],
    references: [exerciseGridPosition.exerciseId],
  }),
}));

export const exerciseGridPosition = pgTable("exercise_grid_position", {
  id: uuid("id").defaultRandom().primaryKey(),
  exerciseId: uuid("exercise_id")
    .notNull()
    .references(() => exercises.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  gridPosition: serial("grid_position"),
});

export const exercisesData = pgTable(
  "exercise_data",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    exerciseId: uuid("exercise_id")
      .notNull()
      .references(() => exercises.id, { onDelete: "cascade" }),
    numberOfRepetitions: integer("number_of_repetitions").notNull(),
    weightLifted: integer("weight_lifted").notNull(),
    oneRepMax: real("one_rep_max").notNull(),
    doneAt: date("done_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (exerciseData) => ({
    unq: unique().on(exerciseData.doneAt, exerciseData.exerciseId),
  })
);

export const exerciseDatasRelations = relations(exercisesData, ({ one }) => ({
  exercise: one(exercises, {
    fields: [exercisesData.exerciseId],
    references: [exercises.id],
  }),
}));

export type Exercise = InferModel<typeof exercises>;
export type ExerciseData = InferModel<typeof exercisesData>;
export type User = InferModel<typeof users>;
