import {
  CatchBoundary,
  ClientOnly,
  createFileRoute,
  getRouteApi,
  Link,
  useCanGoBack,
  useRouter,
} from "@tanstack/react-router";
import { CreateSetDialog } from "~/domains/set/components/create-set-dialog";
import { exerciseQueries } from "~/domains/exercise/exercise.queries";
import { setQueries } from "~/domains/set/set.queries";
import { cn } from "~/styles/styles.utils";
import { Button } from "~/ui/button";
import { Separator } from "~/ui/separator";
import { ArrowLeftIcon, SettingsIcon } from "~/ui/icons";
import { ExerciseAdvanceOverviewGraph } from "~/domains/exercise/components/exercise-advanced-overview-graph";
import { SetFrequencyGraph } from "~/domains/set/components/set-frequency-graph";
import { TagsList } from "~/domains/exercise/components/tags-list";
import { DefaultFallback } from "~/ui/fallback";
import type { ComponentProps } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { SetsList } from "~/domains/set/components/sets-list";
import { defaultColumns } from "~/domains/set/components/sets-list.columns";
import { RepsRangeGraph } from "~/domains/set/components/reps-range-graph";
import { PrLineGraph } from "~/domains/set/components/pr-line-graph";
import { VolumePerSessionGraph } from "~/domains/set/components/volume-per-session-graph";

export const Route = createFileRoute("/(authed)/exercises/$exerciseId/")({
  component: () => RouteComponent(),
  loader: async ({ context, params }) => {
    const exercise = await context.queryClient.ensureQueryData(
      exerciseQueries.get(params.exerciseId),
    );

    await Promise.all([
      context.queryClient.ensureQueryData(exerciseQueries.tags(exercise.id)),
      context.queryClient.ensureQueryData(setQueries.getAll(params.exerciseId)),
    ]);
  },
});

const RouteComponent = () => {
  const params = Route.useParams();
  const exercise = useSuspenseQuery(exerciseQueries.get(params.exerciseId));
  const sets = useSuspenseQuery(setQueries.getAll(params.exerciseId));

  return (
    <Main>
      <Header>
        <Title>{exercise.data.name}</Title>
        <Button variant="secondary" size="sm" asChild>
          <routeApi.Link
            to="/exercises/$exerciseId/settings"
            aria-label="exercise settings"
          >
            <span className="hidden lg:inline-flex">settings</span>
            <SettingsIcon className="lg:hidden" />
          </routeApi.Link>
        </Button>
        <CreateSetDialog />
        <ClientOnly>
          <BackBtn />
        </ClientOnly>
      </Header>

      <Separator />

      <CatchBoundary
        errorComponent={DefaultFallback}
        getResetKey={() => "reset"}
      >
        <Section>
          <SectionTitle>1 rep max graph</SectionTitle>

          <Panel className="py-2 sm:p-4">
            <ExerciseAdvanceOverviewGraph sets={sets.data} />
          </Panel>
        </Section>
      </CatchBoundary>

      <Section>
        <SectionTitle>more graphs</SectionTitle>

        <GridOfPanels>
          <Panel className="h-48 p-3">
            <span className="text-muted-foreground text-xs font-medium">
              reps range
            </span>
            <RepsRangeGraph sets={sets.data} />
          </Panel>
          <Panel className="h-48 p-3">
            <span className="text-muted-foreground text-xs font-medium">
              progressive prs
            </span>
            <PrLineGraph sets={sets.data} />
          </Panel>
          <Panel className="h-48 p-3">
            <span className="text-muted-foreground text-xs font-medium">
              volume per session
            </span>
            <VolumePerSessionGraph sets={sets.data} />
          </Panel>
        </GridOfPanels>
      </Section>

      <CatchBoundary
        errorComponent={DefaultFallback}
        getResetKey={() => "reset"}
      >
        <Section>
          <SectionTitle>sets frequency</SectionTitle>

          <Panel className="py-2 sm:p-4">
            <SetFrequencyGraph sets={sets.data} />
          </Panel>
        </Section>
      </CatchBoundary>

      <CatchBoundary
        errorComponent={DefaultFallback}
        getResetKey={() => "reset"}
      >
        <Section>
          <SectionTitle>tags</SectionTitle>

          <Panel>
            <TagsList />
          </Panel>
        </Section>
      </CatchBoundary>

      <CatchBoundary
        errorComponent={DefaultFallback}
        getResetKey={() => "reset"}
      >
        <Section>
          <SectionTitle>sets</SectionTitle>

          <SetsList sets={sets.data} columns={defaultColumns} />
        </Section>
      </CatchBoundary>
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

const Header = (props: ComponentProps<"header">) => {
  return <header className="grid grid-cols-[1fr_auto_auto] gap-2" {...props} />;
};

const Title = (props: ComponentProps<"h1">) => {
  return (
    <h1 className="truncate text-3xl font-semibold capitalize" {...props} />
  );
};

const GridOfPanels = (props: ComponentProps<"ul">) => {
  return (
    <ul
      className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,20rem),1fr))] gap-4"
      {...props}
    />
  );
};

const Panel = ({ className, ...props }: ComponentProps<"li">) => {
  return (
    <li
      className={cn(
        "bg-secondary overlfow-hidden relative grid rounded-md border",
        className,
      )}
      {...props}
    />
  );
};

const routeApi = getRouteApi("/(authed)/exercises/$exerciseId");

const BackBtn = () => {
  const canGoBack = useCanGoBack();
  const router = useRouter();

  if (canGoBack) {
    return (
      <Button
        variant="link"
        className="text-muted-foreground row-start-2 mr-auto p-0"
        onClick={() => router.history.back()}
      >
        <ArrowLeftIcon />
        <span>back</span>
      </Button>
    );
  }

  return (
    <Button
      asChild
      variant="link"
      className="text-muted-foreground row-start-2 mr-auto p-0"
    >
      <Link to="/exercises">
        <ArrowLeftIcon />
        <span>back</span>
      </Link>
    </Button>
  );
};
