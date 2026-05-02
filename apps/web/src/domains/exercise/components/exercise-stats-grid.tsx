import type { ComponentProps } from "react";
import { cn } from "~/styles/styles.utils";
import type { Set } from "@gym-graphs/shared/set/schemas";
import { CatchBoundary } from "@tanstack/react-router";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { WeightValue } from "~/domains/user/components/weight-value";
import { WeightUnit } from "~/domains/user/components/weight-unit";
import { useSortSetsByOneRepMax } from "~/domains/set/hooks/use-sort-sets-by-one-rep-max";
import { useSuspenseQuery } from "@tanstack/react-query";
import { userQueries } from "~/domains/user/user.queries";
import {
  accumulateVolumeInSets,
  calculateOneRepMax,
} from "~/domains/set/set.utils";
import { useMemo } from "react";

type Props = {
  sets: ReadonlyArray<Set>;
};

export const ExerciseStatGrid = (props: Props) => {
  return (
    <Grid>
      <CatchBoundary
        errorComponent={StatCardFallback}
        getResetKey={() => "reset"}
      >
        <BestOneRepMaxCard sets={props.sets} />
      </CatchBoundary>

      <CatchBoundary
        errorComponent={StatCardFallback}
        getResetKey={() => "reset"}
      >
        <HighestWeightCard sets={props.sets} />
      </CatchBoundary>

      <CatchBoundary
        errorComponent={StatCardFallback}
        getResetKey={() => "reset"}
      >
        <TotalVolumeCard sets={props.sets} />
      </CatchBoundary>

      <CatchBoundary
        errorComponent={StatCardFallback}
        getResetKey={() => "reset"}
      >
        <TotalSetsCard sets={props.sets} />
      </CatchBoundary>
    </Grid>
  );
};

const BestOneRepMaxCard = (props: Props) => {
  const sortedByOneRepMax = useSortSetsByOneRepMax(props.sets);
  const bestSet = sortedByOneRepMax.at(0);
  const user = useSuspenseQuery(userQueries.get);

  const bestOneRepMax = bestSet
    ? calculateOneRepMax(
        bestSet.weightInMg,
        bestSet.repetitions,
        user.data.oneRepMaxAlgo,
      )
    : 0;

  return (
    <Card>
      <Label>best 1rm</Label>
      <Value>
        <WeightValue weightInMg={bestOneRepMax} />{" "}
        <Unit>
          <WeightUnit />
        </Unit>
      </Value>
    </Card>
  );
};

const HighestWeightCard = (props: Props) => {
  const heaviestSet = useMemo(() => {
    return props.sets.toSorted((a, b) => b.weightInMg - a.weightInMg).at(0);
  }, [props.sets]);

  return (
    <Card>
      <Label>highest weight</Label>
      <Value>
        <WeightValue weightInMg={heaviestSet?.weightInMg ?? 0} />{" "}
        <Unit>
          <WeightUnit />
        </Unit>
      </Value>
    </Card>
  );
};

const TotalVolumeCard = (props: Props) => {
  const totalVolume = useMemo(
    () => accumulateVolumeInSets(props.sets),
    [props.sets],
  );

  return (
    <Card>
      <Label>total volume</Label>
      <Value>
        <WeightValue weightInMg={totalVolume} />{" "}
        <Unit>
          <WeightUnit />
        </Unit>
      </Value>
    </Card>
  );
};

const TotalSetsCard = (props: Props) => {
  return (
    <Card>
      <Label>total sets</Label>
      <Value>{props.sets.length}</Value>
    </Card>
  );
};

const StatCardFallback = (props: ErrorComponentProps) => {
  return (
    <Card
      role="alert"
      className="border-destructive bg-destructive/10 cursor-pointer"
      title={props.error.message}
      onClick={props.reset}
    >
      <Label className="text-destructive">error</Label>
      <Value className="text-destructive text-sm font-medium">
        something went wrong
      </Value>
    </Card>
  );
};

const Grid = (props: ComponentProps<"ul">) => {
  return (
    <ul
      className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,15rem),1fr))] gap-3"
      {...props}
    />
  );
};

const Card = ({ className, ...props }: ComponentProps<"li">) => {
  return (
    <li
      className={cn(
        "bg-secondary flex flex-col gap-1 rounded-md border p-3",
        className,
      )}
      {...props}
    />
  );
};

const Label = ({ className, ...props }: ComponentProps<"dt">) => {
  return (
    <dt
      className={cn("text-muted-foreground text-xs font-medium", className)}
      {...props}
    />
  );
};

const Value = ({ className, ...props }: ComponentProps<"dd">) => {
  return (
    <dd
      className={cn("truncate text-2xl font-semibold", className)}
      {...props}
    />
  );
};

const Unit = (props: ComponentProps<"span">) => {
  return (
    <span className="text-muted-foreground text-sm font-medium" {...props} />
  );
};
