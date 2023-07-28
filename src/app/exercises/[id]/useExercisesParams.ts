import { useSearchParams } from "next/navigation";
import { z } from "zod";

export const useExerciseParams = () => {
  const params = useSearchParams();

  const from = params.get("from");
  const to = params.get("to");

  const dateSchema = z.coerce.date();

  const getFromDate = () => {
    const fromDate = dateSchema.safeParse(from ?? "");

    if (!fromDate.success) {
      return null;
    }

    return fromDate.data;
  };

  const getToDate = () => {
    const toDate = dateSchema.safeParse(to ?? "");

    if (!toDate.success) {
      return null;
    }

    return toDate.data;
  };

  return { getToDate, getFromDate };
};
