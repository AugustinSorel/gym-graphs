"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";

export const useDashboardSearchParams = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const exerciseName = searchParams.get("name")?.trim().toLowerCase() ?? "";
  const muscleGroups = searchParams.get("muscle_groups")?.split(",") ?? [];

  const updateExerciseName = (exerciseName: string) => {
    const params = new URLSearchParams(searchParams);

    if (!exerciseName) {
      params.delete("name");
    } else {
      params.set("name", exerciseName);
    }

    router.replace(`${pathname}?${params.toString()}`);
  };

  const updateMuscleGroups = (selectedMuscleGroups: Array<string>) => {
    const params = new URLSearchParams(searchParams);

    if (!selectedMuscleGroups.length) {
      params.delete("muscle_groups");
    } else {
      params.set("muscle_groups", selectedMuscleGroups.join(","));
    }

    router.replace(`${pathname}?${params.toString()}`);
  };

  return {
    exerciseName,
    muscleGroups,
    updateExerciseName,
    updateMuscleGroups,
  };
};
