import { db } from "@/db";
import { columns } from "./_table/columns";
import { DataTable } from "./_table/dataTable";
import { redirect } from "next/navigation";
import type { ComponentProps } from "react";
import type { Exercise } from "@/db/types";
import { whereDoneAtIsBetweenDates } from "../getDateLimit";
import type { SafeExercisePageProps } from "../page";

const Page = async (props: SafeExercisePageProps) => {
  const exercise = await getExercise(props.params.id, props.searchParams);

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
  datesLimit: SafeExercisePageProps["searchParams"]
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
