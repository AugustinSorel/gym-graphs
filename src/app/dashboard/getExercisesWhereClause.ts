import { exercises, muscleGroupsEnum } from "@/db/schema";
import type { Exercise, User } from "@/db/types";
import { and, arrayOverlaps, eq, ilike } from "drizzle-orm";

export type DashboardPageProps = {
  searchParams: { tags?: string; search?: string };
};

type Props = DashboardPageProps & { userId: User["id"] };

export const getExercisesWhereClause = ({ searchParams, userId }: Props) => {
  const muscleGroups = searchParams.tags
    ? (searchParams.tags
        .split(",")
        .filter((item) =>
          (muscleGroupsEnum.enumValues as string[]).includes(item)
        ) as Exercise["muscleGroups"])
    : null;

  if (muscleGroups && searchParams.search) {
    return and(
      eq(exercises.userId, userId),
      arrayOverlaps(exercises.muscleGroups, muscleGroups),
      ilike(exercises.name, `%${searchParams.search}%`)
    );
  }

  if (!searchParams.tags && searchParams.search) {
    return and(
      eq(exercises.userId, userId),
      ilike(exercises.name, `%${searchParams.search}%`)
    );
  }

  if (muscleGroups && !searchParams.search) {
    return and(
      eq(exercises.userId, userId),
      arrayOverlaps(exercises.muscleGroups, muscleGroups)
    );
  }

  return and(eq(exercises.userId, userId));
};
