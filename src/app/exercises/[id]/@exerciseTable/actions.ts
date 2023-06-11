"use server";

import type {
  UpdateNumberOfRepsSchema,
  UpdateWeightLiftedSchema,
} from "@/schemas/exerciseSchemas";

export const updateNumberOfRepsAction = async (e: UpdateNumberOfRepsSchema) => {
  await new Promise((res) => setTimeout(res, 1_000));

  console.log(e);
};

export const updateWeightLiftedAction = async (e: UpdateWeightLiftedSchema) => {
  await new Promise((res) => setTimeout(res, 1_000));

  console.log(e);
};
