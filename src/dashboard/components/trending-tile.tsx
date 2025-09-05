import { Button } from "~/ui/button";
import { useTiles } from "~/dashboard/hooks/use-tiles";
import { Link } from "@tanstack/react-router";
import { Badge } from "~/ui/badge";
import { Skeleton } from "~/ui/skeleton";
import { cn } from "~/styles/styles.utils";
import { ArrowDownIcon, ArrowUpIcon, EqualIcon } from "~/ui/icons";
import { calculateOneRepMax } from "~/set/set.utils";
import { useUser } from "~/user/hooks/use-user";
import { useBestSortedSets } from "~/set/hooks/use-best-sorted-sets";
import { percentageChange } from "~/utils/math";
import type { ComponentProps } from "react";
import type { Set } from "~/db/db.schemas";
import type { ErrorComponentProps } from "@tanstack/react-router";

export const TrendingTile = (props: { tile: Tile }) => {
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

export const TrendingTileFallback = (props: ErrorComponentProps) => {
  return (
    <Card className="border-destructive bg-destructive/10">
      <Name>Something went wrong</Name>
      <ErrorMsg>{props.error.message}</ErrorMsg>
    </Card>
  );
};

export const TrendingTileSkeleton = () => {
  return (
    <Skeleton>
      <Card className="h-14" />
    </Skeleton>
  );
};

type Tile = Readonly<ReturnType<typeof useTiles>["data"][number]>;

const ExerciseTile = (props: { tile: Tile }) => {
  if (!props.tile.exercise) {
    throw new Error("no exercise");
  }

  return (
    <Card className="hover:bg-accent group transition-colors">
      <Button variant="link" asChild className="absolute inset-0 h-auto">
        <Link
          to="/exercises/$exerciseId"
          params={{ exerciseId: props.tile.exercise.id }}
          aria-label={`go to exercise ${props.tile.exercise.id}`}
        />
      </Button>

      <Name className="group-hover:underline">{props.tile.name}</Name>
      <LastTwoSetsProgress sets={props.tile.exercise.sets} />
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
    return <p className="text-muted-foreground text-xs">no data</p>;
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

  if (ratio === 0) {
    return (
      <Badge variant="outline" className="gap-0.5">
        <EqualIcon />
        {ratio.toLocaleString(undefined, { maximumFractionDigits: 0 })}%
      </Badge>
    );
  }

  if (ratio > 0) {
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

const Name = ({ className, ...props }: ComponentProps<"h2">) => {
  return (
    <h2
      {...props}
      className={cn("truncate text-sm font-semibold capitalize", className)}
    />
  );
};

const ErrorMsg = (props: ComponentProps<"code">) => {
  return <code className="overflow-auto" {...props} />;
};
