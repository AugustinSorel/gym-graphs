import { authOptions } from "@/lib/auth";
import { type User, getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { exerciseId as exerciseIdSchema } from "@/schemas/exerciseSchemas";
import type { Exercise } from "@/db/types";
import { db } from "@/db";
import { ExerciseDetailsProvider } from "./exerciseDetailsContext";
import { ExerciseGraphCard } from "./_graph/exerciseGraphCard";
import { ExerciseTableCard } from "./_table/exerciseTableCard";
import { exerciseTableColumns } from "./_table/_table/columns";

export type ExercisePageProps = {
  params: { id?: Exercise["id"] };
};

const Page = async (unsafeProps: ExercisePageProps) => {
  const props = parseExercisePageProps(unsafeProps);
  const session = await getServerSession(authOptions);

  if (!props || !session?.user.id) {
    return redirect("/dashboard");
  }

  const exercise = await getExercise(props.exerciseId, session.user.id);

  if (!exercise) {
    return redirect("/dashboard");
  }

  return (
    <ExerciseDetailsProvider exercise={exercise}>
      <ExerciseGraphCard />
      <ExerciseTableCard columns={exerciseTableColumns} />
    </ExerciseDetailsProvider>
  );
};

export default Page;

const parseExercisePageProps = (props: ExercisePageProps) => {
  const exerciseId = exerciseIdSchema.safeParse(props.params.id);

  if (!exerciseId.success) {
    return null;
  }

  return {
    exerciseId: exerciseId.data,
  };
};

const getExercise = (exerciseId: Exercise["id"], userId: User["id"]) => {
  return db.query.exercises.findFirst({
    with: {
      data: {
        orderBy: (data, { asc }) => [asc(data.doneAt)],
      },
    },
    where: (exercise, { eq, and }) =>
      and(eq(exercise.id, exerciseId), eq(exercise.userId, userId)),
  });
};
