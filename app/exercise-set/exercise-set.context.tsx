import { ComponentProps, createContext, use } from "react";
import { ExerciseSet } from "~/db/db.schemas";

const ExerciseSetCtx = createContext<ExerciseSet | undefined>(undefined);

export const ExerciseSetProvider = (
  props: ComponentProps<typeof ExerciseSetCtx>,
) => {
  return <ExerciseSetCtx {...props} />;
};

export const useExerciseSet = () => {
  const ctx = use(ExerciseSetCtx);

  if (!ctx) {
    throw new Error(
      "useExerciseSet must be wrapped within a <ExserciseSetProvider/>",
    );
  }

  return ctx;
};
