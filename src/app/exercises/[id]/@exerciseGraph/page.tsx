import { db } from "@/db";
import type { Exercise } from "@/db/types";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { exercisesData } from "@/db/schema";
import { whereDoneAtIsBetweenDates } from "../getDateLimit";
import type { SafeExercisePageProps } from "../page";
import { ExerciseGraphCard } from "./exerciseGraphCard";

const Page = async (props: SafeExercisePageProps) => {
  const exercise = await getExercise(props.params.id, props.searchParams);

  if (!exercise) {
    return redirect("/dashboard");
  }

  return <ExerciseGraphCard exercise={exercise} />;
};

export default Page;

//TODO:waiting on drizzle to support extras property: https://orm.drizzle.team/docs/rqb#include-custom-fields
//for now using 2 queries instead of using the missing extras
const getExercise = (
  exerciseId: Exercise["id"],
  datesLimit: SafeExercisePageProps["searchParams"],
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
          whereDoneAtIsBetweenDates(datesLimit),
        ),
      )
      .orderBy(exercisesData.doneAt);

    return {
      ...exercise,
      filteredData,
    };
  });
};
