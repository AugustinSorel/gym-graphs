"use server";

import { db } from "@/db";
import { exercisesTag } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import type { Exercise } from "@/db/types";
import type { ExerciseTag } from "@/schemas/exerciseTag";

export const addNewTagToExercise = async (
  exerciseId: Exercise["id"],
  exerciseTag: ExerciseTag
) => {
  await db.insert(exercisesTag).values({ exerciseId, text: exerciseTag });
};

export const removeExerciseTag = async (
  exerciseId: Exercise["id"],
  exerciseTag: ExerciseTag
) => {
  await db
    .delete(exercisesTag)
    .where(
      and(
        eq(exercisesTag.exerciseId, exerciseId),
        eq(exercisesTag.text, exerciseTag)
      )
    );
};
