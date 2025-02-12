import { useSortable } from "@dnd-kit/sortable";
import { GripVertical } from "lucide-react";
import { Suspense } from "react";
import {
  TilesSetsHeatMapGraph,
  TilesSetsHeatMapGraphSkeleton,
} from "~/dashboard/components/tiles-sets-heat-map-graph";
import { Button } from "~/ui/button";
import {
  TilesFunFacts,
  TilesFunFactsSkeleton,
} from "~/dashboard/components/tiles-fun-facts";
import {
  TilesToSetsCountGraphSkeleton,
  TilesToSetsCountGraph,
} from "~/dashboard/components/tiles-to-sets-count-graph";
import { ExerciseOverviewGraph } from "~/exercise/components/exercise-overview-graph";
import {
  TilesToTagsCountGraph,
  TilesToTagsGraphSkeleton,
} from "~/dashboard/components/tiles-to-tags-count-graph";
import { getRouteApi, Link } from "@tanstack/react-router";
import { cn } from "~/styles/styles.utils";
import { Skeleton } from "~/ui/skeleton";
import type { useTiles } from "~/dashboard/hooks/use-tiles";
import type { ComponentProps } from "react";
import type { ErrorComponentProps } from "@tanstack/react-router";
import type { ButtonProps } from "~/ui/button";

export const Tile = (props: TileProps) => {
  switch (props.tile.type) {
    case "exercise":
      return <ExerciseTile tile={props.tile} />;
    case "tilesToSetsCount":
      return <TilesToSetsCountTile tile={props.tile} />;
    case "tilesToTagsCount":
      return <TilesToTagsCount tile={props.tile} />;
    case "tilesSetsHeatMap":
      return <TilesSetsHeatMapTile tile={props.tile} />;
    case "tilesFunFacts":
      return <TilesFunFactsTile tile={props.tile} />;
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
        <Name>{props.tile.name}</Name>
        <DragButton {...sortable.listeners} {...sortable.attributes} />
      </CardHeader>

      <ExerciseOverviewGraph sets={props.tile.exercise.sets} />
    </Card>
  );
};

const TilesToTagsCount = (props: TileProps) => {
  const sortable = useSortable({ id: props.tile.id });

  return (
    <Card>
      <CardHeader>
        <Name>{props.tile.name}</Name>
        <DragButton {...sortable.listeners} {...sortable.attributes} />
      </CardHeader>

      <Suspense fallback={<TilesToTagsGraphSkeleton />}>
        <TilesToTagsCountGraph />
      </Suspense>
    </Card>
  );
};

const TilesToSetsCountTile = (props: TileProps) => {
  const sortable = useSortable({ id: props.tile.id });

  return (
    <Card>
      <CardHeader>
        <Name>{props.tile.name}</Name>
        <DragButton {...sortable.listeners} {...sortable.attributes} />
      </CardHeader>

      <Suspense fallback={<TilesToSetsCountGraphSkeleton />}>
        <TilesToSetsCountGraph />
      </Suspense>
    </Card>
  );
};

const TilesFunFactsTile = (props: TileProps) => {
  const sortable = useSortable({ id: props.tile.id });

  return (
    <Card>
      <CardHeader>
        <Name>{props.tile.name}</Name>
        <DragButton {...sortable.listeners} {...sortable.attributes} />
      </CardHeader>

      <Suspense fallback={<TilesFunFactsSkeleton />}>
        <TilesFunFacts />
      </Suspense>
    </Card>
  );
};

const TilesSetsHeatMapTile = (props: TileProps) => {
  const sortable = useSortable({ id: props.tile.id });

  const monthName = new Date().toLocaleString("default", { month: "long" });

  return (
    <Card>
      <CardHeader>
        <Name>
          {props.tile.name} - {monthName}
        </Name>
        <DragButton {...sortable.listeners} {...sortable.attributes} />
      </CardHeader>

      <Suspense fallback={<TilesSetsHeatMapGraphSkeleton />}>
        <TilesSetsHeatMapGraph />
      </Suspense>
    </Card>
  );
};

const DragButton = (props: ButtonProps) => {
  const search = routeApi.useSearch();

  const isFiltering = Boolean(search.name ?? search.tags?.length);

  if (isFiltering) {
    return null;
  }

  return (
    <Button
      size="icon"
      variant="ghost"
      className="opacity-full-on-touch-device z-10 cursor-grab opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 active:cursor-grabbing"
      aria-label="drag tile"
      {...props}
      suppressHydrationWarning
    >
      <GripVertical className="!size-3" />
    </Button>
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
    <h2
      className="min-h-8 truncate text-sm font-semibold capitalize"
      {...props}
    />
  );
};

const ErrorMsg = (props: ComponentProps<"code">) => {
  return <code className="overflow-auto p-4" {...props} />;
};

type Tile = Readonly<ReturnType<typeof useTiles>["data"][number]>;
type TileProps = Readonly<{ tile: Tile }>;

const routeApi = getRouteApi("/dashboard/");
