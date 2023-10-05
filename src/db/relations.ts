import { relations } from "drizzle-orm";
import {
  exerciseGridPosition,
  exercises,
  exercisesData,
  exercisesTag,
} from "./schema";

export const exerciseDatasRelations = relations(exercisesData, ({ one }) => ({
  exercise: one(exercises, {
    fields: [exercisesData.exerciseId],
    references: [exercises.id],
  }),
}));

export const exercsiesRelations = relations(exercises, ({ many, one }) => ({
  tags: many(exercisesTag),
  data: many(exercisesData),
  position: one(exerciseGridPosition, {
    fields: [exercises.id],
    references: [exerciseGridPosition.exerciseId],
  }),
}));

export const exerciseTagsRelations = relations(exercisesTag, ({ one }) => ({
  exercise: one(exercises, {
    fields: [exercisesTag.exerciseId],
    references: [exercises.id],
  }),
}));
