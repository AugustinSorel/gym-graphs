import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { AddSetDialog } from "~/set/components/add-set-dialog";
import { ExerciseAdvanceOverviewGraph } from "~/exercise/components/exercise-advanced-overview-graph";
import { ExerciseTable } from "~/exercise/components/exercise-table";
import { exerciseTableColumns } from "~/exercise/components/exercise-table-columns";
import { exerciseKeys } from "~/exercise/exercise.keys";
import { exerciseSchema } from "~/exercise/exericse.schemas";
import { useExercise } from "~/exercise/hooks/useExercise";
import { cn } from "~/styles/styles.utils";
import { Button } from "~/ui/button";
import { Separator } from "~/ui/separator";
import { ArrowLeft } from "lucide-react";
import { ExerciseTagsList } from "~/exercise/components/exercise-tags-list";
import type { ComponentProps } from "react";

export const Route = createFileRoute("/exercises/$exerciseId")({
  params: z.object({
    exerciseId: z.coerce.number().pipe(exerciseSchema.shape.id),
  }),
  component: () => RouteComponent(),
  beforeLoad: async ({ context }) => {
    if (!context.user || !context.session) {
      throw redirect({ to: "/sign-in" });
    }

    return {
      user: context.user,
    };
  },
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
        <AddSetDialog />
        <Button
          asChild
          variant="link"
          className="mr-auto p-0 text-muted-foreground"
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
      className="mx-auto flex max-w-app flex-col gap-10 px-2 pb-20 pt-10 lg:gap-20 lg:px-4 lg:pt-20"
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
      className="grid grid-cols-[auto_auto_1fr] gap-x-2 gap-y-5 lg:grid-cols-[1fr_auto_auto] lg:gap-y-0 [&>a[href='/dashboard']]:row-start-3 [&>h1]:col-span-3 lg:[&>h1]:col-span-1"
      {...props}
    />
  );
};

const Title = (props: ComponentProps<"h1">) => {
  return <h1 className="text-3xl font-semibold capitalize" {...props} />;
};
