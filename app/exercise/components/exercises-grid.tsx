import { useSuspenseQuery } from "@tanstack/react-query";
import { exerciseKeys } from "~/exercise/exercise.keys";
import { useUser } from "~/user/user.context";
import type { ComponentProps } from "react";
import { CatchBoundary, Link, useSearch } from "@tanstack/react-router";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { cn } from "~/styles/styles.utils";
import { ExerciseOverviewGraph } from "~/exercise/components/exercise-overview-graph";
import { Button } from "~/ui/button";

export const ExercisesGrid = () => {
  const exercises = useExercises();

  if (!exercises.data.length) {
    return <NoExercisesText>no exercises</NoExercisesText>;
  }

  return (
    <Grid>
      {exercises.data.map((exercise) => (
        <CatchBoundary
          errorComponent={ExerciseFallback}
          getResetKey={() => "reset"}
          key={exercise.id}
        >
          <Card>
            <Button
              variant="ghost"
              asChild
              className="grid h-[300px] grid-rows-[auto_1fr] items-stretch justify-stretch p-0 [&_svg]:size-auto"
            >
              <Link
                to="/exercises/$exerciseId"
                params={{ exerciseId: exercise.id }}
              >
                <Name>{exercise.name}</Name>
                <ExerciseOverviewGraph sets={exercise.sets} />
              </Link>
            </Button>
          </Card>
        </CatchBoundary>
      ))}
    </Grid>
  );
};

const useExercises = () => {
  const user = useUser();
  const search = useSearch({ from: "/dashboard" });

  return useSuspenseQuery({
    ...exerciseKeys.all(user.id),
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

const Grid = (props: ComponentProps<"ol">) => {
  return (
    <ol
      className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,var(--dashboard-card-width)),1fr))] gap-5"
      {...props}
    />
  );
};

const Card = ({ className, ...props }: ComponentProps<"li">) => {
  return (
    <li
      className={cn("rounded-md border bg-secondary", className)}
      {...props}
    />
  );
};

const ExerciseFallback = (props: ErrorComponentProps) => {
  return (
    <Card className="border-destructive bg-destructive/10">
      <Name className="border-destructive">Something went wrong</Name>
      <ErrorMsg>{props.error.message}</ErrorMsg>
    </Card>
  );
};

const Name = ({ className, ...props }: ComponentProps<"h2">) => {
  return (
    <h2
      className={cn(
        "truncate border-b p-4 text-sm font-semibold capitalize",
        className,
      )}
      {...props}
    />
  );
};

const ErrorMsg = (props: ComponentProps<"code">) => {
  return <code className="overflow-auto p-4" {...props} />;
};

const NoExercisesText = (props: ComponentProps<"p">) => {
  return (
    <p
      className="flex h-32 items-center justify-center rounded-md border bg-secondary"
      {...props}
    />
  );
};
