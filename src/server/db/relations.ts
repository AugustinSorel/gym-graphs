import { relations } from "drizzle-orm";
import {
  exerciseGridPosition,
  exercises,
  exercisesData,
  teams,
  usersToTeams,
  users,
} from "./schema";

export const exerciseDatasRelations = relations(exercisesData, ({ one }) => ({
  exercise: one(exercises, {
    fields: [exercisesData.exerciseId],
    references: [exercises.id],
  }),
}));

export const exercsiesRelations = relations(exercises, ({ many, one }) => ({
  user: one(users, {
    fields: [exercises.userId],
    references: [users.id],
  }),
  data: many(exercisesData),
  position: one(exerciseGridPosition, {
    fields: [exercises.id],
    references: [exerciseGridPosition.exerciseId],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  usersToTeams: many(usersToTeams),
  exercises: many(exercises),
}));

export const teamsRelations = relations(teams, ({ many }) => ({
  usersToTeams: many(usersToTeams),
}));

export const usersToTeamsRelations = relations(usersToTeams, ({ one }) => ({
  team: one(teams, {
    fields: [usersToTeams.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [usersToTeams.memberId],
    references: [users.id],
  }),
}));
