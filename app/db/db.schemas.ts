import { relations, sql } from "drizzle-orm";
import {
  integer,
  pgTable,
  timestamp,
  text,
  unique,
  date,
  pgEnum,
} from "drizzle-orm/pg-core";

export const weightUnitEnum = pgEnum("weight_unit", ["kg", "lbs"]);

export const userTable = pgTable("user", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  email: text("email").notNull().unique(),
  name: text("name").notNull().unique(),
  password: text("password").notNull(),
  weightUnit: weightUnitEnum().notNull().default("kg"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type User = typeof userTable.$inferSelect;

export const userRelations = relations(userTable, ({ one, many }) => ({
  session: one(sessionTable, {
    fields: [userTable.id],
    references: [sessionTable.userId],
  }),
  exercises: many(exerciseTable),
}));

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

export type Session = typeof sessionTable.$inferSelect;

export const sessionRelations = relations(sessionTable, ({ one }) => ({
  user: one(userTable, {
    fields: [sessionTable.userId],
    references: [userTable.id],
  }),
}));

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

export type Exercise = typeof exerciseTable.$inferSelect;

export const exerciseRelations = relations(exerciseTable, ({ one, many }) => ({
  user: one(userTable, {
    fields: [exerciseTable.userId],
    references: [userTable.id],
  }),
  sets: many(exerciseSetTable),
}));

//BUG: unique constraint does not work with new drizzle sintax
export const exerciseSetTable = pgTable(
  "exercise_set",
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

export type ExerciseSet = typeof exerciseSetTable.$inferSelect;

export const exerciseSetRelations = relations(exerciseSetTable, ({ one }) => ({
  exercise: one(exerciseTable, {
    fields: [exerciseSetTable.exerciseId],
    references: [exerciseTable.id],
  }),
}));
