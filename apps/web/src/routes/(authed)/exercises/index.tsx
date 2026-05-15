import { createFileRoute } from "@tanstack/react-router";
import { CreateExerciseDialog } from "~/domains/exercise/components/create-exercise-dialog";
import { ExercisesGrid } from "~/domains/exercise/components/exercises-grid";
import type { ComponentProps } from "react";
import { Schema } from "effect";
import { tagQueries } from "~/domains/tag/tag.queries";
import { FilterExercisesByName } from "~/domains/exercise/components/filter-exercises-by-name";
import { FilterExercisesByTags } from "~/domains/exercise/components/filter-exercises-by-tag";
import { exerciseQueries } from "~/domains/exercise/exercise.queries";

export const Route = createFileRoute("/(authed)/exercises/")({
  validateSearch: (e) => {
    return Schema.decodeUnknownSync(
      Schema.Struct({
        name: Schema.optionalWith(Schema.String, { exact: true }),
        tags: Schema.optionalWith(Schema.String.pipe(Schema.Array), {
          exact: true,
        }),
      }),
    )(e);
  },

  component: () => RouteComponent(),
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    const queries = {
      exercises: exerciseQueries.all(deps),
      tags: tagQueries.all,
    };

    await Promise.all([
      context.queryClient.ensureInfiniteQueryData(queries.exercises),
      context.queryClient.ensureQueryData(queries.tags),
    ]);
  },
});

const RouteComponent = () => {
  return (
    <Main>
      <Header>
        <FilterExercisesByName />
        <FilterExercisesByTags />
        <CreateExerciseDialog />
      </Header>

      <ExercisesGrid />
    </Main>
  );
};

const Main = (props: ComponentProps<"main">) => {
  return (
    <main
      className="max-w-app mx-auto flex flex-col gap-10 overflow-hidden px-2 pt-10 pb-20 sm:px-4 lg:gap-20 lg:pt-20"
      {...props}
    />
  );
};

const Header = (props: ComponentProps<"header">) => {
  return <header className="grid grid-cols-[1fr_auto_auto] gap-2" {...props} />;
};
