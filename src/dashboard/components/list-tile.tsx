import { Button, ButtonProps } from "~/ui/button";
import { useTiles } from "~/dashboard/hooks/use-tiles";
import { ErrorComponentProps, getRouteApi, Link } from "@tanstack/react-router";
import { Badge } from "~/ui/badge";
import { Skeleton } from "~/ui/skeleton";
import { cn } from "~/styles/styles.utils";
import { ArrowDownIcon, ArrowUpIcon, GripVerticalIcon } from "~/ui/icons";
import { useSortable } from "@dnd-kit/sortable";
import { Set } from "~/db/db.schemas";
import { calculateOneRepMax } from "~/set/set.utils";
import { useUser } from "~/user/hooks/use-user";
import { useBestSortedSets } from "~/set/hooks/use-best-sorted-sets";
import type { ComponentProps } from "react";
import { percentageChange } from "~/utils/math";

export const ListTile = (props: { tile: Tile }) => {
  switch (props.tile.type) {
    case "exercise":
      return <ExerciseTile tile={props.tile} />;
    case "tilesToSetsCount":
    case "tilesToTagsCount":
    case "tilesSetsHeatMap":
    case "tilesFunFacts":
      return null;
  }

  props.tile.type satisfies never;
};

export const ListTileFallback = (props: ErrorComponentProps) => {
  return (
    <Card className="border-destructive bg-destructive/10">
      <Name>Something went wrong</Name>
      <ErrorMsg>{props.error.message}</ErrorMsg>
    </Card>
  );
};

export const ListTileSkeleton = () => {
  return (
    <Skeleton>
      <Card className="h-14" />
    </Skeleton>
  );
};

type Tile = Readonly<ReturnType<typeof useTiles>["data"][number]>;

const ExerciseTile = (props: { tile: Tile }) => {
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

      <div className="flex items-center gap-2 truncate">
        <Name>{props.tile.name}</Name>
        <LastTwoSetsProgress sets={props.tile.exercise.sets} />
      </div>

      <div className="flex shrink-0 items-center gap-2 truncate">
        {props.tile.tileToTags.map((tileToTag) => (
          <Badge key={tileToTag.tagId} variant="outline">
            {tileToTag.tag.name}
          </Badge>
        ))}
        <DragButton {...sortable.listeners} {...sortable.attributes} />
      </div>
    </Card>
  );
};

const LastTwoSetsProgress = (props: { sets: Array<Set> }) => {
  const user = useUser();
  const sets = useBestSortedSets(props.sets);

  const set = {
    a: sets.at(-1),
    b: sets.at(-2),
  };

  if (!set.a || !set.b) {
    return null;
  }

  const oneRepMax = {
    a: calculateOneRepMax(
      set.a.weightInKg,
      set.a.repetitions,
      user.data.oneRepMaxAlgo,
    ),
    b: calculateOneRepMax(
      set.b.weightInKg,
      set.b.repetitions,
      user.data.oneRepMaxAlgo,
    ),
  };

  const ratio = percentageChange(oneRepMax.a, oneRepMax.b);

  if (ratio === 100) {
    return null;
  }

  if (ratio > 100) {
    return (
      <Badge variant="success" className="gap-0.5">
        <ArrowUpIcon />
        {ratio.toLocaleString(undefined, { maximumFractionDigits: 0 })}%
      </Badge>
    );
  }

  return (
    <Badge variant="destructive" className="gap-0.5">
      <ArrowDownIcon />
      {ratio.toLocaleString(undefined, { maximumFractionDigits: 0 })}%
    </Badge>
  );
};

const Card = ({ className, ...rest }: ComponentProps<"li">) => {
  return (
    <li
      {...rest}
      className={cn(
        "bg-secondary group relative flex items-center justify-between gap-2 rounded-md border p-4",
        className,
      )}
    />
  );
};

const Name = (props: ComponentProps<"h2">) => {
  return (
    <h2 {...props} className="truncate text-sm font-semibold capitalize" />
  );
};

const ErrorMsg = (props: ComponentProps<"code">) => {
  return <code className="overflow-auto" {...props} />;
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

const routeApi = getRouteApi("/(dashboard)/dashboard");
