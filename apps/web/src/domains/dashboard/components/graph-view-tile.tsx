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
import {
  useSuspenseInfiniteQuery,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useMemo, type ComponentProps } from "react";
import type { ErrorComponentProps } from "@tanstack/react-router";
import type { ButtonProps } from "~/ui/button";
import {
  ExerciseSetCountTileSuccess,
  ExerciseTileWithSetsSuccess,
  SelectAllDashboardTilesSuccess,
} from "@gym-graphs/shared/dashboard-tile/schemas";
import { WeightValue } from "~/domains/user/components/weight-value";
import { WeightUnit } from "~/domains/user/components/weight-unit";
import { useBestSortedSets } from "~/domains/set/hooks/use-best-sorted-sets";
import { useSortSetsByOneRepMax } from "~/domains/set/hooks/use-sort-sets-by-one-rep-max";
import { calculateOneRepMax } from "~/domains/set/set.utils";
import { userQueries } from "~/domains/user/user.queries";
import { useSortSetsByDoneAt } from "~/domains/set/hooks/use-sort-sets-by-done-at";
import { convertWeight } from "~/domains/user/user.utils";
import { timeAgo } from "~/utils/date";

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
  tile: typeof ExerciseTileWithSetsSuccess.Type;
}) => {
  const sortable = useSortable({ id: props.tile.id });

  return (
    <Card className="group hover:border-muted-foreground grid-rows-[auto_auto_1fr_auto] p-4 transition-colors">
      <Button variant="link" asChild className="absolute inset-0 h-auto">
        <Link
          to="/exercises/$exerciseId"
          params={{ exerciseId: props.tile.exerciseId }}
          aria-label={`go to exercise ${props.tile.exerciseId}`}
        />
      </Button>

      <header className="flex items-center justify-between">
        <Name>{props.tile.name}</Name>
        <DragButton {...sortable.listeners} {...sortable.attributes} />
      </header>

      <ExerciseMetadata sets={props.tile.sets} />

      <ExerciseOverviewGraph sets={props.tile.sets} />

      <footer>
        <LastChangeMade sets={props.tile.sets} />
      </footer>
    </Card>
  );
};

const LastChangeMade = (
  props: Pick<typeof ExerciseTileWithSetsSuccess.Type, "sets">,
) => {
  const sortedSets = useSortSetsByDoneAt(props.sets);

  const latestSet = sortedSets.at(0);

  if (!latestSet) {
    return null;
  }

  return (
    <span className="text-muted-foreground flex border-t pt-2 text-xs">
      last: {timeAgo(latestSet?.updatedAt)}
    </span>
  );
};

const ExerciseMetadata = (
  props: Pick<typeof ExerciseTileWithSetsSuccess.Type, "sets">,
) => {
  return (
    <Metadata>
      <MetadataTitle>
        <abbr title="one repetition max" className="no-underline">
          1rm
        </abbr>
      </MetadataTitle>
      <BestOneRepMaxMetadata sets={props.sets} />

      <MetadataTitle className="sr-only">growth</MetadataTitle>
      <GrowthIndicatorMetadata sets={props.sets} />

      <MetadataTitle className="col-start-3">sets</MetadataTitle>
      <SetsCountMetadata sets={props.sets} />
    </Metadata>
  );
};

const Metadata = (props: ComponentProps<"dl">) => {
  return (
    <dl
      className="mt-2 grid grid-cols-[auto_auto_auto] grid-rows-[auto_auto] justify-between gap-x-5 [&>dt]:row-start-2"
      {...props}
    />
  );
};

const MetadataTitle = ({ className, ...props }: ComponentProps<"dt">) => {
  return (
    <dt className={cn("text-muted-foreground text-xs", className)} {...props} />
  );
};

const MetadataValue = (props: ComponentProps<"dt">) => {
  return <dd {...props} />;
};

const SetsCountMetadata = (
  props: Pick<typeof ExerciseTileWithSetsSuccess.Type, "sets">,
) => {
  return (
    <MetadataValue className="text-muted-foreground text-2xl font-semibold">
      {props.sets.length}
    </MetadataValue>
  );
};

const GrowthIndicatorMetadata = (
  props: Pick<typeof ExerciseTileWithSetsSuccess.Type, "sets">,
) => {
  const sortedSets = useSortSetsByDoneAt(props.sets);
  const sets = useBestSortedSets(sortedSets);

  const user = useSuspenseQuery(userQueries.get);

  const latestSet = sets.at(0);
  const secondLatestSet = sets.at(1);

  if (!latestSet) {
    return (
      <MetadataValue>
        <span className="text-muted-foreground text-2xl font-semibold">+0</span>{" "}
        <span className="text-muted-foreground text-sm">
          <WeightUnit />
        </span>
      </MetadataValue>
    );
  }

  const latestOneRepMax = calculateOneRepMax(
    latestSet.weightInKg,
    latestSet.repetitions,
    user.data.oneRepMaxAlgo,
  );

  const secondLatestSetOneRepMax = calculateOneRepMax(
    secondLatestSet?.weightInKg ?? 0,
    secondLatestSet?.repetitions ?? 1,
    user.data.oneRepMaxAlgo,
  );

  const growth = convertWeight(
    latestOneRepMax - secondLatestSetOneRepMax,
    user.data.weightUnit,
  );

  const formatter = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
    signDisplay: "always",
  });

  const growthStatus = growth > 0 ? "inc" : growth === 0 ? "stale" : "dec";

  return (
    <MetadataValue
      className="data-[status=inc]:text-success data-[status=stale]:text-muted-foreground data-[status=dec]:text-destructive"
      data-status={growthStatus}
    >
      <span className="text-2xl font-semibold">{formatter.format(growth)}</span>{" "}
      <span className="text-sm">
        <WeightUnit />
      </span>
    </MetadataValue>
  );
};

const BestOneRepMaxMetadata = (
  props: Pick<typeof ExerciseTileWithSetsSuccess.Type, "sets">,
) => {
  const sortedSets = useSortSetsByOneRepMax(props.sets);
  const bestSet = sortedSets.at(0);
  const user = useSuspenseQuery(userQueries.get);

  if (!bestSet) {
    return (
      <MetadataValue>
        <span className="text-muted-foreground text-2xl font-semibold">0</span>{" "}
        <span className="text-muted-foreground text-sm">
          <WeightUnit />
        </span>
      </MetadataValue>
    );
  }

  const bestOneRepMax = calculateOneRepMax(
    bestSet.weightInKg,
    bestSet.repetitions,
    user.data.oneRepMaxAlgo,
  );

  return (
    <MetadataValue>
      <span className="text-2xl font-semibold">
        <WeightValue weightInKg={bestOneRepMax} />
      </span>{" "}
      <span className="text-muted-foreground text-sm">
        <WeightUnit />
      </span>
    </MetadataValue>
  );
};

const ExerciseSetCountTile = (props: {
  tile: typeof ExerciseSetCountTileSuccess.Type;
}) => {
  const sortable = useSortable({ id: props.tile.id });
  const tiles = useSuspenseInfiniteQuery(tileQueries.all());

  const data = tiles.data
    .filter((tile) => tile.type === "exercise")
    .map((tile) => ({
      name: tile.name,
      count: tile.sets.length,
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
        const entry = counts.get(tag.id);
        if (entry) {
          entry.count += 1;
        } else {
          counts.set(tag.id, {
            id: tag.id,
            name: tag.name,
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
    .flatMap((tile) => tile.sets);

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
    const sets = exerciseTiles.flatMap((tile) => tile.sets);

    const totalWeightInKg = sets.reduce(
      (acc, set) => acc + set.repetitions * set.weightInKg,
      0,
    );
    const totalRepetitions = sets.reduce(
      (acc, set) => acc + set.repetitions,
      0,
    );

    const sorted = exerciseTiles.toSorted(
      (a, b) => a.sets.length - b.sets.length,
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

const Name = (props: ComponentProps<"h2">) => {
  return <h2 className="truncate text-sm capitalize" {...props} />;
};

const ErrorMsg = (props: ComponentProps<"code">) => {
  return <code className="overflow-auto p-4" {...props} />;
};

type Tile =
  (typeof SelectAllDashboardTilesSuccess.Type)["dashboardTiles"][number];

type TileProps = { tile: Tile };

const routeApi = getRouteApi("/(authed)/dashboard");
