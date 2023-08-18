import ExerciseGraph from "./@exerciseGraph/page";
import ExerciseTable from "./@exerciseTable/page";
import NewExerciseDataForm from "./@newExerciseDataForm/page";
import { ExerciseProvider } from "./exerciseContext";
import { redirect } from "next/navigation";
import type { ComponentProps } from "react";
import { db } from "@/db";
import { z } from "zod";
import type { Exercise } from "@/db/types";

const getExercise = (exerciseId: Exercise["id"]) => {
  if (!z.string().uuid().safeParse(exerciseId).success) {
    return;
  }

  return db.query.exercises.findFirst({
    with: { data: true },
    where: (exercise, { eq }) => eq(exercise.id, exerciseId),
  });
};

const Page = async (props: { params: { id: string } }) => {
  const exercise = await getExercise(props.params.id);

  if (!exercise) {
    return redirect("/dashboard");
  }

  return (
    <ExerciseProvider exercise={exercise}>
      <FormContainer>
        <NewExerciseDataForm />
      </FormContainer>

      <ContentContainer>
        <ExerciseGraph />
        <ExerciseTable />
      </ContentContainer>
    </ExerciseProvider>
  );
};

export default Page;

const FormContainer = (props: ComponentProps<"div">) => {
  return <div {...props} className="space-y-5 p-5" />;
};

const ContentContainer = (props: ComponentProps<"div">) => {
  return (
    <div
      {...props}
      className="mx-auto max-w-[calc(var(--exercise-card-height)*4+20px*3)] space-y-5 pb-5 pt-0 sm:px-5"
    />
  );
};
