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
    date: new Date("2025-01-02T09:51:33.261Z"),
    weightLifted: 37,
  },
  {
    date: new Date("2025-01-02T10:51:33.261Z"),
    weightLifted: 741,
  },
  {
    date: new Date("2025-01-02T11:51:33.261Z"),
    weightLifted: 1200,
  },
  {
    date: new Date("2025-01-02T12:51:33.261Z"),
    weightLifted: 1625,
  },
  {
    date: new Date("2025-01-02T13:51:33.261Z"),
    weightLifted: 1574,
  },
  {
    date: new Date("2025-01-02T14:51:33.261Z"),
    weightLifted: 1934,
  },
  {
    date: new Date("2025-01-02T15:51:33.261Z"),
    weightLifted: 1152,
  },
  {
    date: new Date("2025-01-02T16:51:33.261Z"),
    weightLifted: 935,
  },
  {
    date: new Date("2025-01-02T17:51:33.261Z"),
    weightLifted: 2123,
  },
  {
    date: new Date("2025-01-02T18:51:33.261Z"),
    weightLifted: 1544,
  },
  {
    date: new Date("2025-01-02T19:51:33.261Z"),
    weightLifted: 20,
  },
  {
    date: new Date("2025-01-02T20:51:33.261Z"),
    weightLifted: 2655,
  },
  {
    date: new Date("2025-01-02T21:51:33.261Z"),
    weightLifted: 1841,
  },
  {
    date: new Date("2025-01-02T22:51:33.261Z"),
    weightLifted: 2212,
  },
  {
    date: new Date("2025-01-02T23:51:33.261Z"),
    weightLifted: 2390,
  },
  {
    date: new Date("2025-01-03T00:51:33.261Z"),
    weightLifted: 1745,
  },
  {
    date: new Date("2025-01-03T01:51:33.261Z"),
    weightLifted: 1523,
  },
  {
    date: new Date("2025-01-03T02:51:33.261Z"),
    weightLifted: 1920,
  },
  {
    date: new Date("2025-01-03T03:51:33.261Z"),
    weightLifted: 1031,
  },
  {
    date: new Date("2025-01-03T04:51:33.261Z"),
    weightLifted: 1865,
  },
  {
    date: new Date("2025-01-03T05:51:33.261Z"),
    weightLifted: 1152,
  },
  {
    date: new Date("2025-01-03T06:51:33.261Z"),
    weightLifted: 2003,
  },
  {
    date: new Date("2025-01-03T07:51:33.261Z"),
    weightLifted: 2458,
  },
  {
    date: new Date("2025-01-03T08:51:33.261Z"),
    weightLifted: 835,
  },
  {
    date: new Date("2025-01-03T09:51:33.261Z"),
    weightLifted: 708,
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
          key={exercise.name + exercise.userId}
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
