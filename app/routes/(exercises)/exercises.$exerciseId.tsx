import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { CreateSetDialog } from "~/set/components/create-set-dialog";
import { ExerciseAdvanceOverviewGraph } from "~/exercise/components/exercise-advanced-overview-graph";
import { ExerciseTable } from "~/exercise/components/exercise-table";
import { exerciseTableColumns } from "~/exercise/components/exercise-table-columns";
import { exerciseQueries } from "~/exercise/exercise.queries";
import { exerciseSchema } from "~/exercise/exericse.schemas";
import { useExercise } from "~/exercise/hooks/use-exercise";
import { cn } from "~/styles/styles.utils";
import { Button } from "~/ui/button";
import { Separator } from "~/ui/separator";
import { ArrowLeft, Cog } from "lucide-react";
import { ExerciseTagsList } from "~/exercise/components/exercise-tags-list";
import { permissions } from "~/libs/permissions";
import type { ComponentProps } from "react";

export const Route = createFileRoute("/(exercises)/exercises/$exerciseId")({
  params: z.object({
    exerciseId: z.coerce.number().pipe(exerciseSchema.shape.id),
  }),
  component: () => RouteComponent(),
  beforeLoad: ({ context }) => {
    permissions.exercise.view(context.user);
  },
  loader: async ({ context, params }) => {
    const queries = {
      exercise: exerciseQueries.get(params.exerciseId),
    } as const;

    await context.queryClient.ensureQueryData(queries.exercise);
  },
});

const RouteComponent = () => {
  const params = Route.useParams();
  const exercise = useExercise({ id: params.exerciseId });

  return (
    <Main>
      <Header>
        <Title>{exercise.data.tile.name}</Title>
        <Button variant="outline" size="sm" asChild>
          <Link
            to="/exercises/$exerciseId/settings"
            from={Route.fullPath}
            aria-label="exercise settings"
          >
            <span className="hidden lg:inline-flex">settings</span>
            <Cog className="lg:hidden" />
          </Link>
        </Button>
        <CreateSetDialog />
        <Button
          asChild
          variant="link"
          className="text-muted-foreground mr-auto p-0"
        >
          <Link to="/dashboard">
            <ArrowLeft />
            <span>back</span>
          </Link>
        </Button>
      </Header>

      <Separator />

      <Section className="py-2 sm:p-4">
        <ExerciseAdvanceOverviewGraph sets={exercise.data.sets} />
      </Section>

      <Section>
        <ExerciseTagsList />
      </Section>

      <Section>
        <ExerciseTable
          sets={exercise.data.sets}
          columns={exerciseTableColumns}
        />
      </Section>
    </Main>
  );
};

const Main = (props: ComponentProps<"main">) => {
  return (
    <main
      className="max-w-app mx-auto flex flex-col gap-10 px-2 pt-10 pb-20 lg:gap-20 lg:px-4 lg:pt-20"
      {...props}
    />
  );
};

const Section = ({ className, ...props }: ComponentProps<"section">) => {
  return (
    <section
      className={cn("bg-secondary relative grid rounded-md border", className)}
      {...props}
    />
  );
};

const Header = (props: ComponentProps<"header">) => {
  return (
    <header
      className="grid grid-cols-[1fr_auto_auto] gap-2 [&>a[href='/dashboard']]:row-start-2"
      {...props}
    />
  );
};

const Title = (props: ComponentProps<"h1">) => {
  return <h1 className="text-3xl font-semibold capitalize" {...props} />;
};
