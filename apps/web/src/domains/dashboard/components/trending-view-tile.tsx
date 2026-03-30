import { Button } from "~/ui/button";
import { Link } from "@tanstack/react-router";
import { Badge } from "~/ui/badge";
import { Skeleton } from "~/ui/skeleton";
import { cn } from "~/styles/styles.utils";
import { ArrowDownIcon, ArrowUpIcon, EqualIcon } from "~/ui/icons";
import { calculateOneRepMax } from "~/domains/set/set.utils";
import { useSuspenseQuery } from "@tanstack/react-query";
import { userQueries } from "~/domains/user/user.queries";
import { useBestSortedSets } from "~/domains/set/hooks/use-best-sorted-sets";
import { percentageChange } from "~/utils/math";
import type { ComponentProps } from "react";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { ExerciseTileWithSetsSuccess } from "@gym-graphs/shared/dashboard-tile/schemas";

export const TrendingViewTile = (props: Props) => {
  return (
    <Card className="hover:bg-accent group transition-colors">
      {props.tile.exerciseId !== null && (
        <Button variant="link" asChild className="absolute inset-0 h-auto">
          <Link
            to="/exercises/$exerciseId"
            params={{ exerciseId: props.tile.exerciseId }}
            aria-label={`go to exercise ${props.tile.exerciseId}`}
          />
        </Button>
      )}

      <Name className="group-hover:underline">{props.tile.name}</Name>
      <LastTwoSetsProgress sets={props.tile.sets} />
    </Card>
  );
};

type Props = { tile: typeof ExerciseTileWithSetsSuccess.Type };

export const TrendingViewTileFallback = (props: ErrorComponentProps) => {
  return (
    <Card className="border-destructive bg-destructive/10">
      <Name>Something went wrong</Name>
      <ErrorMsg>{props.error.message}</ErrorMsg>
    </Card>
  );
};

export const TrendingViewTileSkeleton = () => {
  return (
    <Skeleton>
      <Card className="h-14" />
    </Skeleton>
  );
};

const LastTwoSetsProgress = (
  props: Pick<typeof ExerciseTileWithSetsSuccess.Type, "sets">,
) => {
  const user = useSuspenseQuery(userQueries.get);
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
