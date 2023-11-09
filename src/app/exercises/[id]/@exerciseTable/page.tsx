import { db } from "@/db";
import { redirect } from "next/navigation";
import type { Exercise } from "@/db/types";
import { whereDoneAtIsBetweenDates } from "../getDateLimit";
import type { SafeExercisePageProps } from "../page";
import { ExerciseTableCard } from "./exerciseTableCard";
import { exerciseTableColumns } from "./_table/columns";

const Page = async (props: SafeExercisePageProps) => {
  const exercise = await getExercise(props.params.id, props.searchParams);

  if (!exercise) {
    return redirect("/dashboard");
  }

  return (
    <ExerciseTableCard columns={exerciseTableColumns} data={exercise.data} />
  );
};

export default Page;

const getExercise = (
  exerciseId: Exercise["id"],
  datesLimit: SafeExercisePageProps["searchParams"],
) => {
  return db.query.exercises.findFirst({
    with: {
      data: {
        orderBy: (data, { desc }) => [desc(data.doneAt)],
        where: () => whereDoneAtIsBetweenDates(datesLimit),
      },
    },
    where: (exercise, { eq }) => eq(exercise.id, exerciseId),
  });
};
