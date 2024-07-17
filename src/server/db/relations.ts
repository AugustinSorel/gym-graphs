import { relations } from "drizzle-orm";
import {
  exerciseGridPosition,
  exercises,
  exercisesData,
  teams,
  usersToTeams,
  users,
  teamInvites,
  userStats,
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

export const usersRelations = relations(users, ({ many, one }) => ({
  usersToTeams: many(usersToTeams),
  exercises: many(exercises),
  stats: one(userStats, {
    fields: [users.id],
    references: [userStats.userId],
  }),
}));

export const teamsRelations = relations(teams, ({ many, one }) => ({
  usersToTeams: many(usersToTeams),
  author: one(users, {
    fields: [teams.authorId],
    references: [users.id],
  }),
  teamInvite: one(teamInvites, {
    fields: [teams.id],
    references: [teamInvites.teamId],
  }),
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
