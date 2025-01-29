import { CatchBoundary, Link } from "@tanstack/react-router";
import { cn } from "~/styles/styles.utils";
import { ExerciseOverviewGraph } from "~/exercise/components/exercise-overview-graph";
import { Button } from "~/ui/button";
import { ExercisesRadarGraph } from "~/exercise/components/exercises-radar-graph";
import { ExercisesFunFacts } from "~/exercise/components/exercises-fun-facts";
import { useExercises } from "~/exercise/hooks/use-exericses";
import { TagsFrequencyPieGraph } from "~/tag/components/tags-frequency-pie-graph";
import { SetsHeatMapGraph } from "~/set/components/sets-heat-map-graph";
import {
  Announcements,
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { GripVertical } from "lucide-react";
import { Fragment, useRef, useState } from "react";
import { useUser } from "~/user/hooks/use-user";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateDashboardTilesOrderAction } from "~/user/user.actions";
import type { ComponentProps, CSSProperties, ReactNode } from "react";
import type { ErrorComponentProps } from "@tanstack/react-router";
import type {
  DragStartEvent,
  ScreenReaderInstructions,
  UniqueIdentifier,
} from "@dnd-kit/core";
import type { DashboardTile } from "~/db/db.schemas";
import { userKeys } from "~/user/user.key";

export const ExercisesGrid = () => {
  const items = useGridItems();

  if (!items.length) {
    return <NoExercisesText>no exercises</NoExercisesText>;
  }

  return (
    <Grid>
      <SortableGrid>
        {(item) => (
          <CatchBoundary
            errorComponent={ExerciseFallback}
            getResetKey={() => "reset"}
            key={item.id}
          >
            <Tile item={item} />
          </CatchBoundary>
        )}
      </SortableGrid>
    </Grid>
  );
};

const SortableGrid = (props: {
  children: (item: DashboardTile) => ReactNode;
}) => {
  const items = useGridItems();
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const isFirstAnnouncement = useRef(true);
  const udpateDashboardTilesOrder = useUpdateDashboardTilesOrder();
  const queryClient = useQueryClient();

  const getIndex = (id: UniqueIdentifier) => {
    return items.findIndex((item) => item.id === id);
  };

  const getPosition = (id: UniqueIdentifier) => {
    return getIndex(id) + 1;
  };

  const activeIndex = activeId != null ? getIndex(activeId) : -1;

  const announcements: Readonly<Announcements> = {
    onDragStart: ({ active }) => {
      return `Picked up sortable item ${active.id}. Sortable item ${active.id} is in position ${getPosition(active.id)} of ${items.length}`;
    },

    onDragOver: ({ active, over }) => {
      if (isFirstAnnouncement.current === true) {
        isFirstAnnouncement.current = false;
        return;
      }

      if (over) {
        return `Sortable item ${active.id} was moved into position ${getPosition(over.id)} of ${items.length}`;
      }

      return;
    },
    onDragEnd: ({ active, over }) => {
      if (over) {
        return `Sortable item ${active.id} was dropped at position ${getPosition(over.id)} of ${items.length}`;
      }

      return;
    },

    onDragCancel: ({ active }) => {
      return `Sorting was cancelled. Sortable item ${active.id} was dropped and returned to position ${getPosition(active.id)} of ${items.length}.`;
    },
  };

  const screenReaderInstructions: ScreenReaderInstructions = {
    draggable: `
    To pick up a sortable item, press the space bar.
    While sorting, use the arrow keys to move the item.
    Press space again to drop the item in its new position, or press escape to cancel.
  `,
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const dragStartHandler = ({ active }: DragStartEvent) => {
    if (!active) {
      return;
    }

    setActiveId(active.id);
  };

  const dragEndHandler = ({ over }: DragEndEvent) => {
    setActiveId(null);

    if (over) {
      const overIndex = getIndex(over.id);

      if (activeIndex !== overIndex) {
        const itemsOrdered = arrayMove(items, activeIndex, overIndex);

        queryClient.setQueryData(userKeys.get.queryKey, (user) => {
          if (!user) {
            return user;
          }

          return {
            ...user,
            dashboardTiles: itemsOrdered,
          };
        });

        udpateDashboardTilesOrder.mutate({
          data: itemsOrdered.toReversed(),
        });
      }
    }
  };

  const dragCancelHandler = () => {
    setActiveId(null);
  };

  return (
    <DndContext
      accessibility={{
        announcements,
        screenReaderInstructions,
      }}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={dragStartHandler}
      onDragEnd={dragEndHandler}
      onDragCancel={dragCancelHandler}
    >
      <SortableContext items={items} strategy={rectSortingStrategy}>
        {items.map((item) => (
          <Fragment key={item.id}>{props.children(item)}</Fragment>
        ))}
      </SortableContext>
    </DndContext>
  );
};

const Tile = (props: { item: DashboardTile }) => {
  switch (props.item.type) {
    case "exercise":
      const exerciseId = props.item.exerciseId;
      return <ExerciseTile exerciseId={exerciseId} tileId={props.item.id} />;
    case "exercisesFrequency":
      return <ExercisesFrequencyTile tileId={props.item.id} />;
    case "tagsFrequency":
      return <TagsFrequencyTile tileId={props.item.id} />;
    case "exercisesFunFacts":
      return <ExercisesFunFactsTile tileId={props.item.id} />;
    case "setsHeatMap":
      return <SetsHeatMapTile tileId={props.item.id} />;
  }

  props.item.type satisfies never;
};

const ExerciseTile = (
  props: TileProps & { exerciseId: DashboardTile["exerciseId"] },
) => {
  const exercises = useExercises();
  const sortable = useSortable({ id: props.tileId });

  const exercise = exercises.data.find((e) => e.id === props.exerciseId);

  if (!exercise) {
    throw new Error("no exercise");
  }

  const x = sortable.transform?.x ?? 0;
  const y = sortable.transform?.y ?? 0;

  const style: Readonly<CSSProperties> = {
    transform: `translate3d(${x ? Math.round(x) : 0}px, ${y ? Math.round(y) : 0}px, 0)`,
    transition: sortable.transition,
    zIndex: sortable.isDragging ? "100" : "auto",
  };

  return (
    <Card ref={sortable.setNodeRef} style={style}>
      <Button variant="link" asChild className="absolute inset-0 h-auto">
        <Link
          to="/exercises/$exerciseId"
          params={{ exerciseId: exercise.id }}
        />
      </Button>

      <CardHeader>
        <Name>{exercise.name}</Name>
        <Button
          size="icon"
          variant="ghost"
          className="z-10 cursor-grab opacity-0 transition-opacity focus-visible:opacity-100 active:cursor-grabbing group-hover:opacity-100"
          {...sortable.listeners}
          {...sortable.attributes}
          suppressHydrationWarning
        >
          <GripVertical className="!size-3" />
        </Button>
      </CardHeader>

      <ExerciseOverviewGraph sets={exercise.sets} />
    </Card>
  );
};

const TagsFrequencyTile = (props: TileProps) => {
  const sortable = useSortable({ id: props.tileId });

  const x = sortable.transform?.x ?? 0;
  const y = sortable.transform?.y ?? 0;

  const style: Readonly<CSSProperties> = {
    transform: `translate3d(${x ? Math.round(x) : 0}px, ${y ? Math.round(y) : 0}px, 0)`,
    transition: sortable.transition,
    zIndex: sortable.isDragging ? "100" : "auto",
  };

  return (
    <Card ref={sortable.setNodeRef} style={style}>
      <CardHeader>
        <Name>tags frequency</Name>
        <Button
          size="icon"
          variant="ghost"
          className="z-10 cursor-grab opacity-0 transition-opacity focus-visible:opacity-100 active:cursor-grabbing group-hover:opacity-100"
          {...sortable.listeners}
          {...sortable.attributes}
          suppressHydrationWarning
        >
          <GripVertical className="!size-3" />
        </Button>
      </CardHeader>

      <TagsFrequencyPieGraph />
    </Card>
  );
};

const ExercisesFrequencyTile = (props: TileProps) => {
  const exercises = useExercises();
  const sortable = useSortable({ id: props.tileId });

  const x = sortable.transform?.x ?? 0;
  const y = sortable.transform?.y ?? 0;

  const style: Readonly<CSSProperties> = {
    transform: `translate3d(${x ? Math.round(x) : 0}px, ${y ? Math.round(y) : 0}px, 0)`,
    transition: sortable.transition,
    zIndex: sortable.isDragging ? "100" : "auto",
  };

  return (
    <Card ref={sortable.setNodeRef} style={style}>
      <CardHeader>
        <Name>exercises frequency</Name>
        <Button
          size="icon"
          variant="ghost"
          className="z-10 cursor-grab opacity-0 transition-opacity focus-visible:opacity-100 active:cursor-grabbing group-hover:opacity-100"
          {...sortable.listeners}
          {...sortable.attributes}
          suppressHydrationWarning
        >
          <GripVertical className="!size-3" />
        </Button>
      </CardHeader>

      <ExercisesRadarGraph
        data={exercises.data.map((exercise) => ({
          frequency: exercise.sets.length,
          name: exercise.name,
        }))}
      />
    </Card>
  );
};

const ExercisesFunFactsTile = (props: TileProps) => {
  const sortable = useSortable({ id: props.tileId });

  const x = sortable.transform?.x ?? 0;
  const y = sortable.transform?.y ?? 0;

  const style: Readonly<CSSProperties> = {
    transform: `translate3d(${x ? Math.round(x) : 0}px, ${y ? Math.round(y) : 0}px, 0)`,
    transition: sortable.transition,
    zIndex: sortable.isDragging ? "100" : "auto",
  };

  return (
    <Card ref={sortable.setNodeRef} style={style}>
      <CardHeader>
        <Name>fun facts</Name>
        <Button
          size="icon"
          variant="ghost"
          className="z-10 cursor-grab opacity-0 transition-opacity focus-visible:opacity-100 active:cursor-grabbing group-hover:opacity-100"
          {...sortable.listeners}
          {...sortable.attributes}
          suppressHydrationWarning
        >
          <GripVertical className="!size-3" />
        </Button>
      </CardHeader>

      <ExercisesFunFacts />
    </Card>
  );
};

const SetsHeatMapTile = (props: TileProps) => {
  const sortable = useSortable({ id: props.tileId });

  const monthName = new Date().toLocaleString("default", { month: "long" });
  const x = sortable.transform?.x ?? 0;
  const y = sortable.transform?.y ?? 0;

  const style: Readonly<CSSProperties> = {
    transform: `translate3d(${x ? Math.round(x) : 0}px, ${y ? Math.round(y) : 0}px, 0)`,
    transition: sortable.transition,
    zIndex: sortable.isDragging ? "100" : "auto",
  };

  return (
    <Card ref={sortable.setNodeRef} style={style}>
      <CardHeader>
        <Name>Heat map - {monthName}</Name>
        <Button
          size="icon"
          variant="ghost"
          className="z-10 cursor-grab opacity-0 transition-opacity focus-visible:opacity-100 active:cursor-grabbing group-hover:opacity-100"
          {...sortable.listeners}
          {...sortable.attributes}
          suppressHydrationWarning
        >
          <GripVertical className="!size-3" />
        </Button>
      </CardHeader>

      <SetsHeatMapGraph />
    </Card>
  );
};

type TileProps = Readonly<{ tileId: DashboardTile["id"] }>;

const useGridItems = () => {
  const exercises = useExercises();
  const user = useUser();

  if (!exercises.data.length) {
    return [];
  }

  return user.data.dashboardTiles;
};

const useUpdateDashboardTilesOrder = () => {
  return useMutation({
    mutationFn: updateDashboardTilesOrderAction,
  });
};

const Grid = (props: ComponentProps<"ol">) => {
  return (
    <ol
      className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,var(--dashboard-card-width)),1fr))] gap-5"
      {...props}
    />
  );
};

const Card = ({ className, ...props }: ComponentProps<"li">) => {
  return (
    <li
      className={cn(
        "group relative grid h-[300px] grid-rows-[auto_1fr] items-stretch justify-stretch rounded-md border bg-secondary p-0 [&_svg]:size-auto",
        className,
      )}
      {...props}
    />
  );
};

const CardHeader = (props: ComponentProps<"header">) => {
  return (
    <header
      className="flex items-center justify-between border-b p-4"
      {...props}
    />
  );
};

const ExerciseFallback = (props: ErrorComponentProps) => {
  return (
    <Card className="border-destructive bg-destructive/10">
      <header className="border-b border-destructive p-4">
        <Name>Something went wrong</Name>
      </header>
      <ErrorMsg>{props.error.message}</ErrorMsg>
    </Card>
  );
};

const Name = (props: ComponentProps<"h2">) => {
  return (
    <h2 className="truncate text-sm font-semibold capitalize" {...props} />
  );
};

const ErrorMsg = (props: ComponentProps<"code">) => {
  return <code className="overflow-auto p-4" {...props} />;
};

const NoExercisesText = (props: ComponentProps<"p">) => {
  return (
    <p
      className="flex h-32 items-center justify-center rounded-md border bg-secondary"
      {...props}
    />
  );
};
