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
import { WeightValue } from "~/domains/user/components/weight-value";
import { WeightUnit } from "~/domains/user/components/weight-unit";
import { useSortSetsByOneRepMax } from "~/domains/set/hooks/use-sort-sets-by-one-rep-max";
import { calculateOneRepMax } from "~/domains/set/set.utils";
import { userQueries } from "~/domains/user/user.queries";
import { useSortSetsByDoneAt } from "~/domains/set/hooks/use-sort-sets-by-done-at";
import { splitTimeAgo } from "~/utils/date";
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

const ExerciseMetadata = (props: Pick<Exercise, "sets">) => {
  return (
    <Metadata>
      <div className="row-span-full">
        <MetadataValue>
          <BestOneRepMaxMetadata sets={props.sets} />
        </MetadataValue>
        <MetadataLabel className="col-start-1 row-start-2 text-xs uppercase">
          <abbr className="no-underline" title="one repetition max">
            1 rep max
          </abbr>
        </MetadataLabel>
      </div>

      <div className="flex items-center justify-end gap-1">
        <MetadataValue className="font-semibold">
          <SetsCount sets={props.sets} />
        </MetadataValue>
        <MetadataLabel>sets</MetadataLabel>
      </div>

      <div className="flex items-center justify-end gap-1">
        <MetadataValue className="font-semibold">
          <LastChangeMadeValue sets={props.sets} />
        </MetadataValue>
        <MetadataLabel>
          <LastChangeMadeLabel sets={props.sets} />
        </MetadataLabel>
      </div>
    </Metadata>
  );
};

const Metadata = (props: ComponentProps<"dl">) => {
  return (
    <dl
      className="mt-1 grid grid-cols-[auto_auto] grid-rows-[auto_auto] justify-between gap-x-5"
      {...props}
    />
  );
};

const MetadataValue = (props: ComponentProps<"dd">) => {
  return <dd {...props} />;
};

const MetadataLabel = ({ className, ...props }: ComponentProps<"dt">) => {
  return (
    <dt className={cn("text-muted-foreground text-sm", className)} {...props} />
  );
};

const SetsCount = (props: Pick<Exercise, "sets">) => {
  return <dd>{props.sets.length}</dd>;
};

const LastChangeMadeValue = (props: Pick<Exercise, "sets">) => {
  const sortedSets = useSortSetsByDoneAt(props.sets, "desc");

  const latestSet = sortedSets.at(0);

  if (!latestSet) {
    return "-";
  }

  const [day] = splitTimeAgo(latestSet.doneAt);

  return day;
};

const LastChangeMadeLabel = (props: Pick<Exercise, "sets">) => {
  const sortedSets = useSortSetsByDoneAt(props.sets, "desc");

  const latestSet = sortedSets.at(0);

  if (!latestSet) {
    return "days ago";
  }

  const [_day, label] = splitTimeAgo(latestSet.doneAt);

  return label;
};

const BestOneRepMaxMetadata = (props: Pick<Exercise, "sets">) => {
  const sortedSets = useSortSetsByOneRepMax(props.sets);
  const bestSet = sortedSets.at(0);
  const user = useSuspenseQuery(userQueries.get);

  if (!bestSet) {
    return (
      <>
        <span className="text-4xl font-semibold">0</span>{" "}
        <span className="text-muted-foreground text-sm">
          <WeightUnit />
        </span>
      </>
    );
  }

  const bestOneRepMax = calculateOneRepMax(
    bestSet.weightInMg,
    bestSet.repetitions,
    user.data.oneRepMaxAlgo,
  );

  return (
    <>
      <span className="text-4xl font-semibold">
        <WeightValue weightInMg={bestOneRepMax} />
      </span>{" "}
      <span className="text-muted-foreground text-sm">
        <WeightUnit />
      </span>
    </>
  );
};

const DragButton = (props: ComponentProps<typeof Button>) => {
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
