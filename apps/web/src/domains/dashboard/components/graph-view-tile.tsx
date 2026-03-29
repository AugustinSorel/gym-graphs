import { useSortable } from "@dnd-kit/sortable";
import { GripVerticalIcon } from "~/ui/icons";
import { Button } from "~/ui/button";
import { getRouteApi, Link } from "@tanstack/react-router";
import { cn } from "~/styles/styles.utils";
import { Skeleton } from "~/ui/skeleton";
import { ExerciseOverviewGraph } from "~/domains/exercise/components/exercise-overview-graph";
import { ExerciseSetCountGraph } from "~/domains/set/components/exercise-set-count-graph";
import { ExerciseTagCountGraph } from "~/domains/tag/components/exercise-tag-count-graph";
import { DashboardHeatMap } from "~/domains/dashboard/components/dashboard-heat-map";
import { DashboardFunFacts } from "~/domains/dashboard/components/dashboard-fun-facts";
import { tileQueries } from "~/domains/tile/tile.queries";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { useMemo, type ComponentProps } from "react";
import type { ErrorComponentProps } from "@tanstack/react-router";
import type { ButtonProps } from "~/ui/button";
import { SelectAllDashboardTilesSuccess } from "@gym-graphs/shared/dashboard-tile/schemas";

export const GraphViewTile = (props: TileProps) => {
  switch (props.tile.type) {
    case "exercise":
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

const ExerciseOverviewTile = (props: {
  tile: Extract<Tile, { type: "exercise" }>;
}) => {
  const sortable = useSortable({ id: props.tile.id });

  if (!props.tile.exercise) {
    throw new Error("exercise is not present in tile with type of exercise");
  }

  return (
    <Card className="group hover:bg-accent transition-colors">
      <Button variant="link" asChild className="absolute inset-0 h-auto">
        <Link
          to="/exercises/$exerciseId"
          params={{ exerciseId: props.tile.exercise.id }}
          aria-label={`go to exercise ${props.tile.exercise.id}`}
        />
      </Button>

      <CardHeader>
        <Name className="group-hover:underline">{props.tile.name}</Name>
        <DragButton {...sortable.listeners} {...sortable.attributes} />
      </CardHeader>

      <ExerciseOverviewGraph sets={props.tile.exercise.sets} />
    </Card>
  );
};

const ExerciseSetCountTile = (props: {
  tile: Extract<Tile, { type: "exerciseSetCount" }>;
}) => {
  const sortable = useSortable({ id: props.tile.id });
  const tiles = useSuspenseInfiniteQuery(tileQueries.all());

  const data = tiles.data
    .filter((tile) => tile.type === "exercise")
    .map((tile) => ({
      name: tile.name,
      count: tile.exercise?.sets.length ?? 0,
    }));

  return (
    <Card>
      <CardHeader>
        <Name>{props.tile.name}</Name>
        <DragButton {...sortable.listeners} {...sortable.attributes} />
      </CardHeader>

      <ExerciseSetCountGraph data={data} />
    </Card>
  );
};

const ExerciseTagCountTile = (props: {
  tile: Extract<Tile, { type: "exerciseTagCount" }>;
}) => {
  const sortable = useSortable({ id: props.tile.id });
  const tiles = useSuspenseInfiniteQuery(tileQueries.all());

  const data = useMemo(() => {
    const counts = new Map<
      number,
      { id: number; name: string; count: number }
    >();

    for (const tile of tiles.data) {
      if (tile.type !== "exercise") continue;
      for (const tag of tile.tags) {
        const entry = counts.get(tag.tag.id);
        if (entry) {
          entry.count += 1;
        } else {
          counts.set(tag.tag.id, {
            id: tag.tag.id,
            name: tag.tag.name,
            count: 1,
          });
        }
      }
    }

    return [...counts.values()].sort((a, b) => b.count - a.count);
  }, [tiles.data]);

  return (
    <Card>
      <CardHeader>
        <Name>{props.tile.name}</Name>
        <DragButton {...sortable.listeners} {...sortable.attributes} />
      </CardHeader>

      <ExerciseTagCountGraph data={data} />
    </Card>
  );
};

const DashboardHeatMapTile = (props: {
  tile: Extract<Tile, { type: "dashboardHeatMap" }>;
}) => {
  const sortable = useSortable({ id: props.tile.id });
  const tiles = useSuspenseInfiniteQuery(tileQueries.all());

  const sets = tiles.data
    .filter((tile) => tile.type === "exercise")
    .flatMap((tile) => tile.exercise?.sets ?? []);

  const monthName = new Date().toLocaleString("default", { month: "long" });

  return (
    <Card>
      <CardHeader>
        <Name>
          {props.tile.name} - {monthName}
        </Name>
        <DragButton {...sortable.listeners} {...sortable.attributes} />
      </CardHeader>

      <DashboardHeatMap sets={sets} />
    </Card>
  );
};

const DashboardFunFactsTile = (props: {
  tile: Extract<Tile, { type: "dashboardFunFacts" }>;
}) => {
  const sortable = useSortable({ id: props.tile.id });
  const tiles = useSuspenseInfiniteQuery(tileQueries.all());

  const data = useMemo(() => {
    const exerciseTiles = tiles.data.filter((tile) => tile.type === "exercise");
    const sets = exerciseTiles.flatMap((tile) => tile.exercise?.sets ?? []);

    const totalWeightInKg = sets.reduce(
      (acc, set) => acc + set.repetitions * set.weightInKg,
      0,
    );
    const totalRepetitions = sets.reduce((acc, set) => acc + set.repetitions, 0);

    const sorted = exerciseTiles.toSorted(
      (a, b) => (a.exercise?.sets.length ?? 0) - (b.exercise?.sets.length ?? 0),
    );

    return {
      totalWeightInKg,
      totalRepetitions,
      tileWithMostSets: { name: sorted.at(-1)?.name ?? "unknown" },
      tileWithLeastSets: { name: sorted.at(0)?.name ?? "unknown" },
    };
  }, [tiles.data]);

  return (
    <Card>
      <CardHeader>
        <Name>{props.tile.name}</Name>
        <DragButton {...sortable.listeners} {...sortable.attributes} />
      </CardHeader>

      <DashboardFunFacts data={data} />
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

type Tile =
  (typeof SelectAllDashboardTilesSuccess.Type)["dashboardTiles"][number];

type TileProps = { tile: Tile };

const routeApi = getRouteApi("/(authed)/dashboard");
