"use server";

import { newExerciseNameSchema } from "@/schemas/exerciseSchemas";

export const addNewExerciseAction = async (formData: FormData) => {
  "use server";
  const data = newExerciseNameSchema.safeParse({
    name: formData.get("newExerciseName"),
  });

  if (!data.success) {
    throw new Error(data.error.issues[0]?.message);
  }

  await new Promise((resolve) => setTimeout(resolve, 1000));
  //TODO: inset data in db
  console.log(`data: ${data.data.name}`);
};
