import {
  timestamp,
  pgTable,
  text,
  primaryKey,
  integer,
  uuid,
  unique,
  serial,
  date,
  real,
} from "drizzle-orm/pg-core";
import type { AdapterAccount } from "@auth/core/adapters";
import { muscleGroups } from "@/lib/muscleGroups";

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
    tags: text("tags", { enum: muscleGroups })
      .array()
      .notNull()
      //FIXME: for some reason drizzle is bugged and does not work with []
      .default("{}" as unknown as []),
  },
  (exercise) => ({
    unq: unique().on(exercise.userId, exercise.name),
  })
);

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
    weightLifted: real("weight_lifted").notNull(),
    doneAt: date("done_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (exerciseData) => ({
    unq: unique().on(exerciseData.doneAt, exerciseData.exerciseId),
  })
);
