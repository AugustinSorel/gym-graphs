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
  pgEnum,
  boolean,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { type AdapterAccount } from "next-auth/adapters";

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
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  }),
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
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  }),
);

export const muscleGroupsEnum = pgEnum("muscle_groups", [
  "legs",
  "chest",
  "biceps",
  "triceps",
  "back",
  "shoulders",
  "calfs",
  "abs",
  "traps",
]);

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

    muscleGroups: muscleGroupsEnum("muscle_groups")
      .array()
      .notNull()
      .default(sql`'{}'`),
  },
  (exercise) => ({
    unq: unique().on(exercise.userId, exercise.name),
  }),
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
  }),
);

export const userStats = pgTable("user_stats", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .unique()
    .notNull(),
  numberOfExercisesCreated: integer("number_of_exercises_created").notNull(),
  numberOfDataLogged: integer("number_of_data_logged").notNull(),
  numberOfDays: integer("number_of_days").notNull(),
  numberOfRepetitionsMade: integer("number_of_repetitions_made").notNull(),
  amountOfWeightLifted: integer("amount_of_weight_lifted").notNull(),
});

export const teams = pgTable(
  "team",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    authorId: text("member_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    unq: unique().on(table.authorId, table.name),
  }),
);

export const usersToTeams = pgTable(
  "users_to_teams",
  {
    teamId: uuid("team_id")
      .references(() => teams.id, { onDelete: "cascade" })
      .notNull(),
    memberId: text("member_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    compoundKey: primaryKey({ columns: [table.teamId, table.memberId] }),
  }),
);

export const teamInvites = pgTable("team_invite", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull(),
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  token: uuid("token").defaultRandom().notNull(),
  accepted: boolean("accepted").default(false).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
