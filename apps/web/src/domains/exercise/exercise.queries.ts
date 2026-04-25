import { SelectAllExercisesUrlParams } from "@gym-graphs/shared/exercise/schemas";
import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { callApi } from "~/libs/api";

const get = (exerciseId: number) => {
  return queryOptions({
    queryKey: ["exercises", exerciseId],
    queryFn: async () => {
      return callApi((api) => api.Exercise.get({ path: { exerciseId } }));
    },
  });
};

const all = (
  urlParams?: Omit<typeof SelectAllExercisesUrlParams.Encoded, "cursor">,
) => {
  return infiniteQueryOptions({
    queryKey: ["exercises", urlParams?.name, urlParams?.tags],
    queryFn: async ({ pageParam }) => {
      return callApi((api) =>
        api.Exercise.all({
          urlParams: {
            ...urlParams,
            cursor: pageParam,
          },
        }),
      );
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    select: (exercises) => exercises.pages.flatMap((pages) => pages.exercises),
  });
};

const tags = (exerciseId: number) =>
  queryOptions({
    queryKey: ["exercises", exerciseId, "tags"],
    queryFn: async () =>
      callApi((api) => api.Exercise.getTags({ path: { exerciseId } })),
  });

const stats = queryOptions({
  queryKey: ["exercises", "stats"],
  queryFn: async () => callApi((api) => api.Exercise.stats()),
});

export const exerciseQueries = {
  all,
  get,
  tags,
  stats,
};
