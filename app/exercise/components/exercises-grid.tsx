import { useSuspenseQuery } from "@tanstack/react-query";
import { exerciseKeys } from "../exercise.keys";
import { useUser } from "~/context/user.context";
import { ComponentProps } from "react";
import {
  CatchBoundary,
  ErrorComponentProps,
  Link,
  useSearch,
} from "@tanstack/react-router";
import { cn } from "~/styles/styles.utils";
import { ExerciseOverviewGraph } from "./exercise-overview-graph";
import { Button } from "~/ui/button";

const data = [
  {
    doneAt: new Date("2025-01-02T09:51:33.261Z"),
    weightInKg: 37,
    repetitions: 37,
  },
  {
    doneAt: new Date("2025-01-02T10:51:33.261Z"),
    weightInKg: 741,
    repetitions: 741,
  },
  {
    doneAt: new Date("2025-01-02T11:51:33.261Z"),
    weightInKg: 1200,
    repetitions: 1200,
  },
  {
    doneAt: new Date("2025-01-02T12:51:33.261Z"),
    weightInKg: 1625,
    repetitions: 1625,
  },
  {
    doneAt: new Date("2025-01-02T13:51:33.261Z"),
    weightInKg: 1574,
    repetitions: 1574,
  },
  {
    doneAt: new Date("2025-01-02T14:51:33.261Z"),
    weightInKg: 1934,
    repetitions: 1934,
  },
  {
    doneAt: new Date("2025-01-02T15:51:33.261Z"),
    weightInKg: 1152,
    repetitions: 1152,
  },
  {
    doneAt: new Date("2025-01-02T16:51:33.261Z"),
    weightInKg: 935,
    repetitions: 935,
  },
  {
    doneAt: new Date("2025-01-02T17:51:33.261Z"),
    weightInKg: 2123,
    repetitions: 2123,
  },
  {
    doneAt: new Date("2025-01-02T18:51:33.261Z"),
    weightInKg: 1544,
    repetitions: 1544,
  },
  {
    doneAt: new Date("2025-01-02T19:51:33.261Z"),
    weightInKg: 20,
    repetitions: 20,
  },
  {
    doneAt: new Date("2025-01-02T20:51:33.261Z"),
    weightInKg: 2655,
    repetitions: 2655,
  },
  {
    doneAt: new Date("2025-01-02T21:51:33.261Z"),
    weightInKg: 1841,
    repetitions: 1841,
  },
  {
    doneAt: new Date("2025-01-02T22:51:33.261Z"),
    weightInKg: 2212,
    repetitions: 2212,
  },
  {
    doneAt: new Date("2025-01-02T23:51:33.261Z"),
    weightInKg: 2390,
    repetitions: 2390,
  },
  {
    doneAt: new Date("2025-01-03T00:51:33.261Z"),
    weightInKg: 1745,
    repetitions: 1745,
  },
  {
    doneAt: new Date("2025-01-03T01:51:33.261Z"),
    weightInKg: 1523,
    repetitions: 1523,
  },
  {
    doneAt: new Date("2025-01-03T02:51:33.261Z"),
    weightInKg: 1920,
    repetitions: 1920,
  },
  {
    doneAt: new Date("2025-01-03T03:51:33.261Z"),
    weightInKg: 1031,
    repetitions: 1031,
  },
  {
    doneAt: new Date("2025-01-03T04:51:33.261Z"),
    weightInKg: 1865,
    repetitions: 1865,
  },
  {
    doneAt: new Date("2025-01-03T05:51:33.261Z"),
    weightInKg: 1152,
    repetitions: 1152,
  },
  {
    doneAt: new Date("2025-01-03T06:51:33.261Z"),
    weightInKg: 2003,
    repetitions: 2003,
  },
  {
    doneAt: new Date("2025-01-03T07:51:33.261Z"),
    weightInKg: 2458,
    repetitions: 2458,
  },
  {
    doneAt: new Date("2025-01-03T08:51:33.261Z"),
    weightInKg: 835,
    repetitions: 835,
  },
  {
    doneAt: new Date("2025-01-03T09:51:33.261Z"),
    weightInKg: 708,
    repetitions: 708,
  },
];

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
          key={exercise.id}
        >
          <Exercise>
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
                <ExerciseOverviewGraph exercisePoints={data} />
              </Link>
            </Button>
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
      className={cn("rounded-md border bg-secondary", className)}
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
