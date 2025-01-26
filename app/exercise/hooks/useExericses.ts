import { useSuspenseQuery } from "@tanstack/react-query";
import { useUser } from "~/user/hooks/use-user";
import { exerciseKeys } from "~/exercise/exercise.keys";
import { useSearch } from "@tanstack/react-router";

export const useExercises = () => {
  const user = useUser();
  const search = useSearch({ strict: false });

  return useSuspenseQuery({
    ...exerciseKeys.all(user.data.id),
    select: (exercises) => {
      return exercises.filter((exercise) => {
        const nameMatches = exercise.name.includes(search.name ?? "");

        const tagsMatch =
          !search.tags?.length ||
          exercise.tags.find((exerciseTag) =>
            search.tags?.includes(exerciseTag.tag.name),
          );

        return nameMatches && tagsMatch;
      });
    },
  });
};
