import { redirect } from "next/navigation";
import type { Exercise } from "@/db/types";
import { z } from "zod";
import { exerciseId as exerciseIdSchema } from "@/schemas/exerciseSchemas";

export type ExercisePageProps = {
  params: { id?: Exercise["id"] };
  searchParams: { from?: string; to?: string };
};

export type SafeExercisePageProps = {
  params: { id: Exercise["id"] };
  searchParams: { from: string; to: string };
};

//FIXME: make this page trully private
const Page = (unsafeProps: ExercisePageProps) => {
  const props = parseExercisePageProps(unsafeProps);

  if (!props) {
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
