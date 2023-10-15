import { db } from "@/db";
import { columns } from "./_table/columns";
import { DataTable } from "./_table/dataTable";
import { redirect } from "next/navigation";
import type { ExercisePageProps } from "../parseExercisePageProps";
import { parseExercisePageProps } from "../parseExercisePageProps";
import type { ComponentProps } from "react";
import type { Exercise } from "@/db/types";
import { whereDoneAtIsBetweenDates } from "../getDateLimit";

const Page = async (unsafeProps: ExercisePageProps) => {
  const parsedProps = parseExercisePageProps(unsafeProps);

  if (!parsedProps) {
    return redirect("/dashboard");
  }

  const exercise = await getExercise(
    parsedProps.exerciseId,
    parsedProps.datesLimit
  );

  if (!exercise) {
    return redirect("/dashboard");
  }

  return (
    <Card>
      <DataTable columns={columns} data={exercise.data} />
    </Card>
  );
};

export default Page;

const getExercise = (
  exerciseId: Exercise["id"],
  datesLimit: ExercisePageProps["searchParams"]
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

const Card = (props: ComponentProps<"div">) => {
  return (
    <div
      {...props}
      className="overflow-hidden border-y border-border bg-primary backdrop-blur-md sm:rounded-md sm:border"
    />
  );
};
