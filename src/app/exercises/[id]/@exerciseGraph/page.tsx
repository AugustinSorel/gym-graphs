import { db } from "@/db";
import { ExerciseGraph } from "./exerciseGraph";
import { type ComponentProps } from "react";
import type { Exercise } from "@/db/types";
import { redirect } from "next/navigation";
import { parseExercisePageProps } from "../parseExercisePageProps";
import type { ExercisePageProps } from "../parseExercisePageProps";
import { and, eq } from "drizzle-orm";
import { exercisesData } from "@/db/schema";
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
      <CardHeader>
        <CardTitle>{exercise.name}</CardTitle>
      </CardHeader>

      <CardBody>
        <ExerciseGraph exercise={exercise} />
      </CardBody>
    </Card>
  );
};

export default Page;

//TODO:waiting on drizzle to support extras property: https://orm.drizzle.team/docs/rqb#include-custom-fields
//for now using 2 queries instead of using the missing extras
const getExercise = (
  exerciseId: Exercise["id"],
  datesLimit: ExercisePageProps["searchParams"]
) => {
  return db.transaction(async (tx) => {
    const exercise = await tx.query.exercises.findFirst({
      with: {
        data: {
          orderBy: (data, { asc }) => [asc(data.doneAt)],
        },
      },
      where: (exercise, { eq }) => eq(exercise.id, exerciseId),
    });

    if (!exercise) {
      return null;
    }

    const filteredData = await tx
      .select()
      .from(exercisesData)
      .where(
        and(
          eq(exercisesData.exerciseId, exerciseId),
          whereDoneAtIsBetweenDates(datesLimit)
        )
      )
      .orderBy(exercisesData.doneAt);

    return {
      ...exercise,
      filteredData,
    };
  });
};

const Card = (props: ComponentProps<"div">) => {
  return (
    <div
      {...props}
      className="border-y border-border bg-primary backdrop-blur-md sm:rounded-md sm:border"
    />
  );
};

const CardHeader = (props: ComponentProps<"header">) => {
  return (
    <header {...props} className="border-b border-border bg-primary p-3" />
  );
};

const CardTitle = (props: ComponentProps<"h2">) => {
  return <h2 {...props} className="truncate font-medium capitalize" />;
};

const CardBody = (props: ComponentProps<"div">) => {
  return <div {...props} className="relative h-[500px] overflow-hidden" />;
};
