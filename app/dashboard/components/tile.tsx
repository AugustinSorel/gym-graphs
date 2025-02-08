import { useSortable } from "@dnd-kit/sortable";
import { GripVertical } from "lucide-react";
import { Suspense } from "react";
import {
  SetsHeatMapGraph,
  SetsHeatMapGraphSkeleton,
} from "~/set/components/sets-heat-map-graph";
import { Button } from "~/ui/button";
import {
  DashboardFunFacts,
  DashboardFunFactsSkeleton,
} from "~/dashboard/components/dashboard-fun-facts";
import {
  ExerciseFrequencyGraphSkeleton,
  ExercisesFrequencyGraph,
} from "~/exercise/components/exercises-frequency-graph";
import { ExerciseOverviewGraph } from "~/exercise/components/exercise-overview-graph";
import {
  TagsFrequencyGraph,
  TagsFrequencyGraphSkeleton,
} from "~/tag/components/tags-frequency-graph";
import { Link } from "@tanstack/react-router";
import { cn } from "~/styles/styles.utils";
import { Skeleton } from "~/ui/skeleton";
import type { useTiles } from "~/dashboard/hooks/use-tiles";
import type { ComponentProps } from "react";
import type { ErrorComponentProps } from "@tanstack/react-router";

export const Tile = (props: TileProps) => {
  switch (props.tile.type) {
    case "exercise":
      return <ExerciseTile tile={props.tile} />;
    case "exercisesFrequency":
      return <ExercisesFrequencyTile tile={props.tile} />;
    case "tagsFrequency":
      return <TagsFrequencyTile tile={props.tile} />;
    case "exercisesFunFacts":
      return <ExercisesFunFactsTile tile={props.tile} />;
    case "setsHeatMap":
      return <SetsHeatMapTile tile={props.tile} />;
  }

  props.tile.type satisfies never;
};

export const TileFallback = (props: ErrorComponentProps) => {
  return (
    <Card className="border-destructive bg-destructive/10">
      <header className="border-destructive border-b p-4">
        <Name>Something went wrong</Name>
      </header>
      <ErrorMsg>{props.error.message}</ErrorMsg>
    </Card>
  );
};

export const TileSkeleton = () => {
  return (
    <Skeleton>
      <Card>
        <CardHeader className="h-16" />
      </Card>
    </Skeleton>
  );
};

const ExerciseTile = (props: TileProps) => {
  const sortable = useSortable({ id: props.tile.id });

  if (!props.tile.exercise) {
    throw new Error("no exercise");
  }

  return (
    <Card>
      <Button variant="link" asChild className="absolute inset-0 h-auto">
        <Link
          to="/exercises/$exerciseId"
          params={{ exerciseId: props.tile.exercise.id }}
          aria-label={`go to exercise ${props.tile.exercise.id}`}
        />
      </Button>

      <CardHeader>
        <Name>{props.tile.exercise.name}</Name>
        <Button
          size="icon"
          variant="ghost"
          className="opacity-full-on-touch-device z-10 cursor-grab opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 active:cursor-grabbing"
          aria-label="drag tile"
          {...sortable.listeners}
          {...sortable.attributes}
          suppressHydrationWarning
        >
          <GripVertical className="!size-3" />
        </Button>
      </CardHeader>

      <ExerciseOverviewGraph sets={props.tile.exercise.sets} />
    </Card>
  );
};

const TagsFrequencyTile = (props: TileProps) => {
  const sortable = useSortable({ id: props.tile.id });

  return (
    <Card>
      <CardHeader>
        <Name>tags frequency</Name>
        <Button
          size="icon"
          variant="ghost"
          className="opacity-full-on-touch-device z-10 cursor-grab opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 active:cursor-grabbing"
          aria-label="drag tile"
          {...sortable.listeners}
          {...sortable.attributes}
          suppressHydrationWarning
        >
          <GripVertical className="!size-3" />
        </Button>
      </CardHeader>

      <Suspense fallback={<TagsFrequencyGraphSkeleton />}>
        <TagsFrequencyGraph />
      </Suspense>
    </Card>
  );
};

const ExercisesFrequencyTile = (props: TileProps) => {
  const sortable = useSortable({ id: props.tile.id });

  return (
    <Card>
      <CardHeader>
        <Name>exercises frequency</Name>
        <Button
          size="icon"
          variant="ghost"
          className="opacity-full-on-touch-device z-10 cursor-grab opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 active:cursor-grabbing"
          aria-label="drag tile"
          {...sortable.listeners}
          {...sortable.attributes}
          suppressHydrationWarning
        >
          <GripVertical className="!size-3" />
        </Button>
      </CardHeader>

      <Suspense fallback={<ExerciseFrequencyGraphSkeleton />}>
        <ExercisesFrequencyGraph />
      </Suspense>
    </Card>
  );
};

const ExercisesFunFactsTile = (props: TileProps) => {
  const sortable = useSortable({ id: props.tile.id });

  return (
    <Card>
      <CardHeader>
        <Name>fun facts</Name>
        <Button
          size="icon"
          variant="ghost"
          className="opacity-full-on-touch-device z-10 cursor-grab opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 active:cursor-grabbing"
          aria-label="drag tile"
          {...sortable.listeners}
          {...sortable.attributes}
          suppressHydrationWarning
        >
          <GripVertical className="!size-3" />
        </Button>
      </CardHeader>

      <Suspense fallback={<DashboardFunFactsSkeleton />}>
        <DashboardFunFacts />
      </Suspense>
    </Card>
  );
};

const SetsHeatMapTile = (props: TileProps) => {
  const sortable = useSortable({ id: props.tile.id });

  const monthName = new Date().toLocaleString("default", { month: "long" });

  return (
    <Card>
      <CardHeader>
        <Name>Heat map - {monthName}</Name>
        <Button
          size="icon"
          variant="ghost"
          className="opacity-full-on-touch-device z-10 cursor-grab opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 active:cursor-grabbing"
          aria-label="drag tile"
          {...sortable.listeners}
          {...sortable.attributes}
          suppressHydrationWarning
        >
          <GripVertical className="!size-3" />
        </Button>
      </CardHeader>

      <Suspense fallback={<SetsHeatMapGraphSkeleton />}>
        <SetsHeatMapGraph />
      </Suspense>
    </Card>
  );
};

const Card = ({ className, ...props }: ComponentProps<"li">) => {
  return (
    <li
      className={cn(
        "group bg-secondary relative grid h-[300px] grid-rows-[auto_1fr] items-stretch justify-stretch rounded-md border p-0 [&_svg]:size-auto",
        className,
      )}
      {...props}
    />
  );
};

const CardHeader = ({ className, ...props }: ComponentProps<"header">) => {
  return (
    <header
      className={cn(
        "flex items-center justify-between border-b p-4",
        className,
      )}
      {...props}
    />
  );
};

const Name = (props: ComponentProps<"h2">) => {
  return (
    <h2 className="truncate text-sm font-semibold capitalize" {...props} />
  );
};

const ErrorMsg = (props: ComponentProps<"code">) => {
  return <code className="overflow-auto p-4" {...props} />;
};

type Tile = Readonly<ReturnType<typeof useTiles>["data"][number]>;
type TileProps = Readonly<{ tile: Tile }>;
