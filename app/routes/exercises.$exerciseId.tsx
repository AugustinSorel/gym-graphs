import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import { ComponentProps } from "react";
import { z } from "zod";
import { AddExerciseSetDialog } from "~/exercise-set/components/add-exercise-set-dialog";
import { ExerciseAdvanceOverviewGraph } from "~/exercise/components/exercise-advanced-overview-graph";
import { ExerciseTable } from "~/exercise/components/exercise-table";
import { exerciseKeys } from "~/exercise/exercise.keys";
import { exerciseSchema } from "~/exercise/exericse.schemas";
import { useExercise } from "~/exercise/hooks/useExercise";
import { cn } from "~/styles/styles.utils";
import { Button } from "~/ui/button";
import { Separator } from "~/ui/separator";

export const Route = createFileRoute("/exercises/$exerciseId")({
  component: () => RouteComponent(),
  beforeLoad: async ({ context }) => {
    if (!context.user || !context.session) {
      throw redirect({ to: "/sign-in" });
    }

    return {
      user: context.user,
    };
  },
  params: z.object({
    exerciseId: z.coerce.number().pipe(exerciseSchema.shape.id),
  }),
  loader: async ({ context, params }) => {
    const key = exerciseKeys.get(context.user.id, params.exerciseId);

    await context.queryClient.ensureQueryData(key);
  },
});

const RouteComponent = () => {
  const params = Route.useParams();
  const exercise = useExercise({ id: params.exerciseId });

  return (
    <Main>
      <Header>
        <Title>{exercise.data.name}</Title>
        <Button variant="outline" size="sm" asChild>
          <Link to="/exercises/$exerciseId/settings" from={Route.fullPath}>
            settings
          </Link>
        </Button>
        <AddExerciseSetDialog />
      </Header>

      <Separator />

      <Section className="h-[500px]">
        <ExerciseAdvanceOverviewGraph sets={exercise.data.sets} />
      </Section>

      <Section>
        <ExerciseTable sets={exercise.data.sets} />
      </Section>
    </Main>
  );
};

const Main = (props: ComponentProps<"main">) => {
  return (
    <main
      className="mx-auto flex max-w-app flex-col gap-10 px-4 py-20"
      {...props}
    />
  );
};

const Section = ({ className, ...props }: ComponentProps<"section">) => {
  return (
    <section
      className={cn("relative grid rounded-md border bg-secondary", className)}
      {...props}
    />
  );
};

const Header = (props: ComponentProps<"header">) => {
  return (
    <header
      className="grid grid-cols-[auto_auto_1fr] gap-x-2 gap-y-5 lg:grid-cols-[1fr_auto_auto] [&>h1]:col-span-3 lg:[&>h1]:col-span-1"
      {...props}
    />
  );
};

const Title = (props: ComponentProps<"h1">) => {
  return <h1 className="text-3xl font-semibold capitalize" {...props} />;
};
