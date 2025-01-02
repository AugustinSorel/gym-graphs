import { useSuspenseQuery } from "@tanstack/react-query";
import { exerciseKeys } from "../exercise.keys";
import { useUser } from "~/features/context/user.context";
import { ComponentProps } from "react";
import {
  CatchBoundary,
  ErrorComponentProps,
  useSearch,
} from "@tanstack/react-router";
import { cn } from "~/features/utils/styles";

export const ExercisesGrid = () => {
  const exercises = useExercises();

  if (!exercises.data.length) {
    return <p className="text-center">no exercises</p>;
  }

  return (
    <List>
      {exercises.data.map((exercise) => (
        <CatchBoundary
          errorComponent={ExerciseFallback}
          getResetKey={() => "reset"}
          key={exercise.name + exercise.userId}
        >
          <Exercise>
            <Name>{exercise.name}</Name>
          </Exercise>
        </CatchBoundary>
      ))}
    </List>
  );
};

const useExercises = () => {
  const user = useUser();
  const search = useSearch({ from: "/dashboard" });

  return useSuspenseQuery({
    ...exerciseKeys.all(user.id),
    select: (exercises) => {
      return exercises.filter((exercise) => {
        if (!search.name) {
          return exercises;
        }

        return exercise.name.includes(search.name);
      });
    },
  });
};

const List = (props: ComponentProps<"ol">) => {
  return (
    <ol
      className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,var(--dashboard-card-width)),1fr))] gap-5"
      {...props}
    />
  );
};

const Exercise = ({ className, ...props }: ComponentProps<"li">) => {
  return (
    <li
      className={cn(
        "grid h-[300px] grid-rows-[auto_1fr] rounded-md border bg-secondary",
        className,
      )}
      {...props}
    />
  );
};

const ExerciseFallback = (props: ErrorComponentProps) => {
  return (
    <Exercise className="border-destructive bg-destructive/10">
      <Name className="border-destructive">Something went wrong</Name>
      <ErrorMsg>{props.error.message}</ErrorMsg>
    </Exercise>
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
