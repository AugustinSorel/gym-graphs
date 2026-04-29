import { useSortable } from "@dnd-kit/sortable";
import { GripVerticalIcon } from "~/ui/icons";
import { Button } from "~/ui/button";
import { getRouteApi, Link } from "@tanstack/react-router";
import { cn } from "~/styles/styles.utils";
import { Skeleton } from "~/ui/skeleton";
import { ExerciseOverviewGraph } from "~/domains/exercise/components/exercise-overview-graph";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { ComponentProps } from "react";
import type { ErrorComponentProps } from "@tanstack/react-router";
import type { ButtonProps } from "~/ui/button";
import { WeightValue } from "~/domains/user/components/weight-value";
import { WeightUnit } from "~/domains/user/components/weight-unit";
import { useBestSortedSets } from "~/domains/set/hooks/use-best-sorted-sets";
import { useSortSetsByOneRepMax } from "~/domains/set/hooks/use-sort-sets-by-one-rep-max";
import { calculateOneRepMax } from "~/domains/set/set.utils";
import { userQueries } from "~/domains/user/user.queries";
import { useSortSetsByDoneAt } from "~/domains/set/hooks/use-sort-sets-by-done-at";
import { convertWeight } from "~/domains/user/user.utils";
import { timeAgo } from "~/utils/date";
import { SelectAllExercisesSuccess } from "@gym-graphs/shared/exercise/schemas";

export const ExerciseCard = (props: Props) => {
  const sortable = useSortable({ id: props.exercise.id });

  return (
    <Card className="group hover:border-muted-foreground grid-rows-[auto_auto_1fr_auto] px-4 py-2 transition-colors">
      <Button variant="link" asChild className="absolute inset-0 h-auto">
        <Link
          to="/exercises/$exerciseId"
          params={{ exerciseId: props.exercise.id }}
          aria-label={`go to exercise ${props.exercise.id}`}
        />
      </Button>

      <header className="flex items-center justify-between">
        <Name>{props.exercise.name}</Name>
        <DragButton {...sortable.listeners} {...sortable.attributes} />
      </header>

      <ExerciseMetadata sets={props.exercise.sets} />

      <ExerciseOverviewGraph sets={props.exercise.sets} />

      <footer>
        <LastChangeMade sets={props.exercise.sets} />
      </footer>
    </Card>
  );
};

export const ExerciseCardFallback = (props: ErrorComponentProps) => {
  return (
    <Card className="border-destructive bg-destructive/10">
      <header className="border-destructive border-b p-4">
        <Name>Something went wrong</Name>
      </header>
      <ErrorMsg>{props.error.message}</ErrorMsg>
    </Card>
  );
};

export const ExerciseCardSkeleton = () => {
  return (
    <Skeleton>
      <Card>
        <CardHeader className="h-16" />
      </Card>
    </Skeleton>
  );
};

const LastChangeMade = (props: Pick<Exercise, "sets">) => {
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

const ExerciseMetadata = (props: Pick<Exercise, "sets">) => {
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

const SetsCountMetadata = (props: Pick<Exercise, "sets">) => {
  return (
    <MetadataValue className="text-muted-foreground text-2xl font-semibold">
      {props.sets.length}
    </MetadataValue>
  );
};

const GrowthIndicatorMetadata = (props: Pick<Exercise, "sets">) => {
  const sortedSets = useSortSetsByDoneAt(props.sets);
  const sets = useBestSortedSets(sortedSets);

  const user = useSuspenseQuery(userQueries.get);

  const latestSet = sets.at(-1);
  const secondLatestSet = sets.at(-2);

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
    latestSet.weightInG,
    latestSet.repetitions,
    user.data.oneRepMaxAlgo,
  );

  const secondLatestSetOneRepMax = calculateOneRepMax(
    secondLatestSet?.weightInG ?? 0,
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

const BestOneRepMaxMetadata = (props: Pick<Exercise, "sets">) => {
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
    bestSet.weightInG,
    bestSet.repetitions,
    user.data.oneRepMaxAlgo,
  );

  return (
    <MetadataValue>
      <span className="text-2xl font-semibold">
        <WeightValue weightInG={bestOneRepMax} />
      </span>{" "}
      <span className="text-muted-foreground text-sm">
        <WeightUnit />
      </span>
    </MetadataValue>
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

type Exercise = (typeof SelectAllExercisesSuccess.Type)["exercises"][number];

type Props = { exercise: Exercise };

const routeApi = getRouteApi("/(authed)/exercises/");
