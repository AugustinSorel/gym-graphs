import { z } from "zod";
import { exerciseId as exerciseIdSchema } from "@/schemas/exerciseSchemas";
import type { Exercise } from "@/db/types";

export type ExercisePageProps = {
  params: { id?: Exercise["id"] };
  searchParams: DateLimit;
};

const datesLimitSchema = z
  .object({
    from: z.coerce.date().nullish(),
    to: z.coerce.date().nullish(),
  })
  .transform((dates) => ({
    from: dates.from ? dates.from.toString() : dates.from,
    to: dates.to ? dates.to.toString() : dates.to,
  }));

type DateLimit = z.infer<typeof datesLimitSchema>;

export const parseExercisePageProps = (props: ExercisePageProps) => {
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
