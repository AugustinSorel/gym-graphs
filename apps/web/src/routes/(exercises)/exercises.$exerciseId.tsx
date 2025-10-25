import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { z } from "zod";
// import { CreateSetDialog } from "~/domains/set/components/create-set-dialog";
// import { ExerciseAdvanceOverviewGraph } from "~/exercise/components/exercise-advanced-overview-graph";
// import { ExerciseTable } from "~/exercise/components/exercise-table";
// import { exerciseTableColumns } from "~/exercise/components/exercise-table-columns";
import { exerciseQueries } from "~/domains/exercise/exercise.queries";
import { exerciseSchema } from "@gym-graphs/schemas/exercise";
import { useExercise } from "~/domains/exercise/hooks/use-exercise";
import { cn } from "~/styles/styles.utils";
import { Button } from "~/ui/button";
import { Separator } from "~/ui/separator";
import { ArrowLeftIcon, SettingsIcon } from "~/ui/icons";
// import { ExerciseTagsList } from "~/exercise/components/exercise-tags-list";
// import { ExerciseSetsFrequencyGraph } from "~/exercise/components/exercise-sets-frequency-graph";
import type { ComponentProps } from "react";

export const Route = createFileRoute("/(exercises)/exercises/$exerciseId")({
  params: z.object({
    exerciseId: z.coerce.number().pipe(exerciseSchema.shape.id),
  }),
  component: () => RouteComponent(),
  beforeLoad: ({ context }) => {
    if (!context.user?.emailVerifiedAt) {
      throw redirect({ to: "/sign-in" });
    }
  },
  loader: async ({ context, params }) => {
    const queries = {
      exercise: exerciseQueries.get(params.exerciseId),
    };

    await context.queryClient.ensureQueryData(queries.exercise);
  },
});

const RouteComponent = () => {
  const params = Route.useParams();
  const exercise = useExercise(params.exerciseId);

  return (
    <Main>
      <Header>
        <Title>{exercise.data.exerciseOverviewTile.tile.name}</Title>
        <Button variant="outline" size="sm" asChild>
          <Link
            to="/exercises/$exerciseId/settings"
            from={Route.fullPath}
            aria-label="exercise settings"
          >
            <span className="hidden lg:inline-flex">settings</span>
            <SettingsIcon className="lg:hidden" />
          </Link>
        </Button>
        {/* <CreateSetDialog /> */}
        <Button
          asChild
          variant="link"
          className="text-muted-foreground mr-auto p-0"
        >
          <Link to="/dashboard">
            <ArrowLeftIcon />
            <span>back</span>
          </Link>
        </Button>
      </Header>

      <Separator />

      <Section>
        <SectionTitle>
          1 <Abbr title="repetitions">rep</Abbr>{" "}
          <Abbr title="maximum">max</Abbr> graph
        </SectionTitle>

        <SectionPanel className="py-2 sm:p-4">
          {/*
          <ExerciseAdvanceOverviewGraph sets={exercise.data.sets} />
          */}
        </SectionPanel>
      </Section>

      <Section>
        <SectionTitle>sets frequency</SectionTitle>

        <SectionPanel className="py-2 sm:p-4">
          {/*
          <ExerciseSetsFrequencyGraph sets={exercise.data.sets} />
          */}
        </SectionPanel>
      </Section>

      <Section>
        <SectionTitle>tags</SectionTitle>

        <SectionPanel>
          {/*
          <ExerciseTagsList />
          */}
        </SectionPanel>
      </Section>

      <Section>
        <SectionTitle>sets</SectionTitle>

        <SectionPanel>
          {/*
<ExerciseTable
            sets={exercise.data.sets}
            columns={exerciseTableColumns}
          />
          */}
        </SectionPanel>
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
  return <section className={cn("space-y-4", className)} {...props} />;
};

const SectionTitle = (props: ComponentProps<"h2">) => {
  return <h2 className="font-semibold" {...props} />;
};

const Abbr = (props: ComponentProps<"abbr">) => {
  return <abbr className="no-underline" {...props} />;
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
  return (
    <h1 className="truncate text-3xl font-semibold capitalize" {...props} />
  );
};

const SectionPanel = ({ className, ...props }: ComponentProps<"div">) => {
  return (
    <div
      className={cn("bg-secondary relative grid rounded-md border", className)}
      {...props}
    />
  );
};
