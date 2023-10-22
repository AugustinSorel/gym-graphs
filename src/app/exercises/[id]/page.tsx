import { redirect } from "next/navigation";
import type { Exercise, User } from "@/db/types";
import { z } from "zod";
import { exerciseId as exerciseIdSchema } from "@/schemas/exerciseSchemas";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { exercises } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export type ExercisePageProps = {
  params: { id?: Exercise["id"] };
  searchParams: { from?: string; to?: string };
};

export type SafeExercisePageProps = {
  params: { id: Exercise["id"] };
  searchParams: { from: string; to: string };
};

const Page = async (unsafeProps: ExercisePageProps) => {
  const props = parseExercisePageProps(unsafeProps);
  const session = await getServerSession(authOptions);

  if (!props || !session?.user.id) {
    return redirect("/dashboard");
  }

  const [exercise] = await getExercise(props.exerciseId, session.user.id);

  if (!exercise) {
    return redirect("/dashboard");
  }

  return null;
};

export default Page;

const datesLimitSchema = z.object({
  from: z.coerce
    .date()
    .min(new Date("1900/01/01"), "date must be after 01/01/1900")
    .nullish(),
  to: z.coerce
    .date()
    .min(new Date("1900/01/01"), "date must be after 01/01/1900")
    .nullish(),
});

const parseExercisePageProps = (props: ExercisePageProps) => {
  const datesLimit = datesLimitSchema.safeParse(props.searchParams);
  const exerciseId = exerciseIdSchema.safeParse(props.params.id);

  if (!datesLimit.success || !exerciseId.success) {
    return null;
  }

  return {
    exerciseId: exerciseId.data,
    datesLimit: datesLimit.data,
  };
};

const getExercise = (exerciseId: Exercise["id"], userId: User["id"]) => {
  return db
    .select()
    .from(exercises)
    .where(and(eq(exercises.id, exerciseId), eq(exercises.userId, userId)));
};
