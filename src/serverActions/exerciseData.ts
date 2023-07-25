"use server";

import type {
  DeleteExerciseSchema,
  UpdateExerciseDataDateSchema,
  UpdateNumberOfRepsSchema,
  UpdateWeightLiftedSchema,
  AddExerciseDataSchema,
} from "@/schemas/exerciseSchemas";

export const addExerciseDataAction = async (
  exerciseData: AddExerciseDataSchema
) => {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  //TODO: inset data in db
  console.log(
    `data: ${exerciseData.weightLifted} and ${exerciseData.numberOfReps} to id: ${exerciseData.id}`
  );
};

export const updateNumberOfRepsAction = async (e: UpdateNumberOfRepsSchema) => {
  await new Promise((res) => setTimeout(res, 1_000));

  console.log(e);
};

export const updateWeightLiftedAction = async (e: UpdateWeightLiftedSchema) => {
  await new Promise((res) => setTimeout(res, 1_000));

  console.log(e);
};

export const deleteDataAction = async (e: DeleteExerciseSchema) => {
  await new Promise((res) => setTimeout(res, 1_000));

  console.log(e);
};

export const updateExerciseDataDate = async (
  e: UpdateExerciseDataDateSchema
) => {
  await new Promise((res) => setTimeout(res, 1_000));

  console.log(e);
};
