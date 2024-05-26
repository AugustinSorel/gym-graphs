"use client";

import { usePathname, useSearchParams, useRouter } from "next/navigation";
import {
  type ExercisePageSearchParams,
  exercisePageSearchParamsSchema,
} from "./exercisePageSearchParams";

export const useExercisePageSearchParams = () => {
  const unsafeSearchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const searchParams = exercisePageSearchParamsSchema.parse({
    from: unsafeSearchParams.get("from"),
    to: unsafeSearchParams.get("to"),
  });

  const update = (props: ExercisePageSearchParams) => {
    const params = new URLSearchParams(unsafeSearchParams);

    if (!props.from) {
      params.delete("from");
    } else {
      params.set("from", props.from);
    }

    if (!props.to) {
      params.delete("to");
    } else {
      params.set("to", props.to);
    }

    router.replace(`${pathname}?${params.toString()}`);
  };

  return { values: searchParams, update };
};
