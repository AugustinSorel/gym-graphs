import { relations } from "drizzle-orm";
import { exerciseGridPosition, exercises, exercisesData } from "./schema";

export const exerciseDatasRelations = relations(exercisesData, ({ one }) => ({
  exercise: one(exercises, {
    fields: [exercisesData.exerciseId],
    references: [exercises.id],
  }),
}));

export const exercsiesRelations = relations(exercises, ({ many, one }) => ({
  data: many(exercisesData),
  position: one(exerciseGridPosition, {
    fields: [exercises.id],
    references: [exerciseGridPosition.exerciseId],
  }),
}));
