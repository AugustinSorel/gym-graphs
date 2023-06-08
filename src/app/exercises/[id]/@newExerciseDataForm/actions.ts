"use server";

import { addExerciseDataSchema } from "@/schemas/exerciseSchemas";

export const addExerciseDataAction = async (e: FormData) => {
  const data = addExerciseDataSchema.safeParse({
    numberOfRepetitions: parseInt(
      (e.get("numberOfRepetitions") as string) ?? "0"
    ),
    weightLifted: parseInt((e.get("weightLifted") as string) ?? "0"),
  });

  if (!data.success) {
    throw new Error(data.error.issues[0]?.message);
  }

  await new Promise((resolve) => setTimeout(resolve, 1000));
  //TODO: inset data in db
  console.log(
    `data: ${data.data.weightLifted} and ${data.data.numberOfRepetitions}`
  );
};
