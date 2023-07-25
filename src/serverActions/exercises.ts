"use server";

import type {
  DeleteExerciseSchema,
  UpdateExerciseNameSchema,
  NewExerciseNameSchema,
} from "@/schemas/exerciseSchemas";
import { addNewExercise } from "@/fakeData";

export const updateExerciseNameAction = async (e: UpdateExerciseNameSchema) => {
  await new Promise((res) => setTimeout(res, 1_000));

  console.log("e: ", e);
};

export const deleteExerciseAction = async (e: DeleteExerciseSchema) => {
  await new Promise((res) => setTimeout(res, 1_000));

  console.log("e: ", e);
};

export const addNewExerciseAction = async (
  newExercise: NewExerciseNameSchema
) => {
  await new Promise((res) => setTimeout(res, 1_000));

  addNewExercise({ name: newExercise.name, gridIndex: 0 });
};
