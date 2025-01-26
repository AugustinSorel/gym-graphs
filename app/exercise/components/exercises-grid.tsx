import { CatchBoundary, Link } from "@tanstack/react-router";
import { cn } from "~/styles/styles.utils";
import { ExerciseOverviewGraph } from "~/exercise/components/exercise-overview-graph";
import { Button } from "~/ui/button";
import { ExercisesRadarGraph } from "~/exercise/components/exercises-radar-graph";
import { ExercisesFunFacts } from "~/exercise/components/exercises-fun-facts";
import { useExercises } from "~/exercise/hooks/use-exericses";
import type { ComponentProps } from "react";
import type { ErrorComponentProps } from "@tanstack/react-router";

export const ExercisesGrid = () => {
  const exercises = useExercises();

  if (!exercises.data.length) {
    return <NoExercisesText>no exercises</NoExercisesText>;
  }

  return (
    <Grid>
      <ExercisesCards />
      <ExercisesFrequencyCard />
      <ExercisesFunFactsCard />
    </Grid>
  );
};

const ExercisesCards = () => {
  const exercises = useExercises();

  return (
    <>
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
    </>
  );
};

const ExercisesFrequencyCard = () => {
  const exercises = useExercises();

  return (
    <CatchBoundary
      errorComponent={ExerciseFallback}
      getResetKey={() => "reset"}
    >
      <Card className="grid h-[300px] grid-rows-[auto_1fr] items-stretch justify-stretch p-0 [&_svg]:size-auto">
        <Name>exercises frequency</Name>
        <ExercisesRadarGraph
          data={exercises.data.map((exercise) => ({
            frequency: exercise.sets.length,
            name: exercise.name,
          }))}
        />
      </Card>
    </CatchBoundary>
  );
};

const ExercisesFunFactsCard = () => {
  return (
    <CatchBoundary
      errorComponent={ExerciseFallback}
      getResetKey={() => "reset"}
    >
      <Card className="grid h-[300px] grid-rows-[auto_1fr] items-stretch justify-stretch overflow-hidden p-0 [&_svg]:size-auto">
        <Name>fun facts</Name>
        <ExercisesFunFacts />
      </Card>
    </CatchBoundary>
  );
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
