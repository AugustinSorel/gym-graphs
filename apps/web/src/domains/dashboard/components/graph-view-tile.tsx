import { useSortable } from "@dnd-kit/sortable";
import { GripVerticalIcon } from "~/ui/icons";
import { Button } from "~/ui/button";
import { ExerciseSetCountGraph } from "~/domains/set/components/exercise-set-count-graph";
import { ExerciseTagCountGraph } from "~/domains/tag/components/exercise-tag-count-graph";
import { getRouteApi, Link } from "@tanstack/react-router";
import { cn } from "~/styles/styles.utils";
import { Skeleton } from "~/ui/skeleton";
import type { useTiles } from "~/domains/tile/hooks/use-tiles";
import type { ComponentProps } from "react";
import type { ErrorComponentProps } from "@tanstack/react-router";
import type { ButtonProps } from "~/ui/button";
import { ExerciseOverviewGraph } from "~/domains/exercise/components/exercise-overview-graph";

export const GraphViewTile = (props: TileProps) => {
  switch (props.tile.type) {
    case "exerciseOverview":
      return <ExerciseOverviewTile tile={props.tile} />;
    case "exerciseSetCount":
      return <ExerciseSetCountTile tile={props.tile} />;
    case "exerciseTagCount":
      return <ExerciseTagCountTile tile={props.tile} />;
    case "dashboardHeatMap":
      return <DashboardHeatMapTile tile={props.tile} />;
    case "dashboardFunFacts":
      return <DashboardFunFactsTile tile={props.tile} />;
  }
};

export const GraphViewTileFallback = (props: ErrorComponentProps) => {
  return (
    <Card className="border-destructive bg-destructive/10">
      <header className="border-destructive border-b p-4">
        <Name>Something went wrong</Name>
      </header>
      <ErrorMsg>{props.error.message}</ErrorMsg>
    </Card>
  );
};

export const GraphViewTileSkeleton = () => {
  return (
    <Skeleton>
      <Card>
        <CardHeader className="h-16" />
      </Card>
    </Skeleton>
  );
};

const ExerciseOverviewTile = (props: { tile: ExerciseOverviewTile }) => {
  const sortable = useSortable({ id: props.tile.id });

  return (
    <Card className="group hover:bg-accent transition-colors">
      <Button variant="link" asChild className="absolute inset-0 h-auto">
        <Link
          to="/exercises/$exerciseId"
          params={{ exerciseId: props.tile.exerciseOverview.exerciseId }}
          aria-label={`go to exercise ${props.tile.exerciseOverview.exerciseId}`}
        />
      </Button>

      <CardHeader>
        <Name className="group-hover:underline">{props.tile.name}</Name>
        <DragButton {...sortable.listeners} {...sortable.attributes} />
      </CardHeader>

      <ExerciseOverviewGraph
        sets={props.tile.exerciseOverview.exercise.sets.map((s) => ({
          ...s,
          doneAt: new Date(s.doneAt),
        }))}
      />
    </Card>
  );
};

const ExerciseTagCountTile = (props: TileProps) => {
  const sortable = useSortable({ id: props.tile.id });

  return (
    <Card>
      <CardHeader>
        <Name>{props.tile.name}</Name>
        <DragButton {...sortable.listeners} {...sortable.attributes} />
      </CardHeader>

      <ExerciseTagCountGraph />
    </Card>
  );
};

const ExerciseSetCountTile = (props: TileProps) => {
  const sortable = useSortable({ id: props.tile.id });

  return (
    <Card>
      <CardHeader>
        <Name>{props.tile.name}</Name>
        <DragButton {...sortable.listeners} {...sortable.attributes} />
      </CardHeader>

      <ExerciseSetCountGraph />
    </Card>
  );
};

const DashboardFunFactsTile = (props: TileProps) => {
  const sortable = useSortable({ id: props.tile.id });

  return (
    <Card>
      <CardHeader>
        <Name>{props.tile.name}</Name>
        <DragButton {...sortable.listeners} {...sortable.attributes} />
      </CardHeader>

      {/*
      <Suspense fallback={<TilesFunFactsSkeleton />}>
        <TilesFunFacts />
      </Suspense>
    */}
    </Card>
  );
};

const DashboardHeatMapTile = (props: TileProps) => {
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

      {/*
      <Suspense fallback={<TilesSetsHeatMapGraphSkeleton />}>
        <TilesSetsHeatMapGraph />
      </Suspense>
    */}
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
      <GripVerticalIcon className="!size-3" />
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

const Name = ({ className, ...props }: ComponentProps<"h2">) => {
  return (
    <h2
      className={cn(className, "truncate text-sm font-semibold capitalize")}
      {...props}
    />
  );
};

const ErrorMsg = (props: ComponentProps<"code">) => {
  return <code className="overflow-auto p-4" {...props} />;
};

type Tile = Readonly<ReturnType<typeof useTiles>["data"][number]>;

type TileProps = Readonly<{ tile: Tile }>;
type ExerciseOverviewTile = Extract<Tile, { type: "exerciseOverview" }>;

const routeApi = getRouteApi("/(dashboard)/dashboard");
