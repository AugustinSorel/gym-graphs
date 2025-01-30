import { CatchBoundary, Link } from "@tanstack/react-router";
import { cn } from "~/styles/styles.utils";
import { ExerciseOverviewGraph } from "~/exercise/components/exercise-overview-graph";
import { Button } from "~/ui/button";
import { ExercisesRadarGraph } from "~/exercise/components/exercises-radar-graph";
import { ExercisesFunFacts } from "~/exercise/components/exercises-fun-facts";
import { TagsFrequencyPieGraph } from "~/tag/components/tags-frequency-pie-graph";
import { SetsHeatMapGraph } from "~/set/components/sets-heat-map-graph";
import {
  Announcements,
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
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
import { userKeys } from "~/user/user.keys";
import { useDashboardTiles } from "~/user/hooks/use-dashboard-tiles";
import type { ComponentProps, CSSProperties, ReactNode } from "react";
import type { ErrorComponentProps } from "@tanstack/react-router";
import type {
  DragStartEvent,
  ScreenReaderInstructions,
  UniqueIdentifier,
} from "@dnd-kit/core";

export const ExercisesGrid = () => {
  const tiles = useGridTiles();
  const exerciseTiles = tiles.filter((tile) => tile.type === "exercise");

  if (!exerciseTiles.length) {
    return <NoExercisesText>no exercises</NoExercisesText>;
  }

  return (
    <Grid>
      <SortableGrid>
        {(tile) => (
          <CatchBoundary
            errorComponent={ExerciseFallback}
            getResetKey={() => "reset"}
            key={tile.id}
          >
            <Tile tile={tile} />
          </CatchBoundary>
        )}
      </SortableGrid>
    </Grid>
  );
};

const SortableGrid = (props: { children: (tile: Tile) => ReactNode }) => {
  const tiles = useGridTiles();
  const user = useUser();
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const isFirstAnnouncement = useRef(true);
  const udpateDashboardTilesOrder = useUpdateDashboardTilesOrder();
  const queryClient = useQueryClient();

  const getIndex = (id: UniqueIdentifier) => {
    return tiles.findIndex((tile) => tile.id === id);
  };

  const getPosition = (id: UniqueIdentifier) => {
    return getIndex(id) + 1;
  };

  const activeIndex = activeId != null ? getIndex(activeId) : -1;

  const announcements: Readonly<Announcements> = {
    onDragStart: ({ active }) => {
      return `Picked up sortable item ${active.id}. Sortable item ${active.id} is in position ${getPosition(active.id)} of ${tiles.length}`;
    },

    onDragOver: ({ active, over }) => {
      if (isFirstAnnouncement.current === true) {
        isFirstAnnouncement.current = false;
        return;
      }

      if (over) {
        return `Sortable item ${active.id} was moved into position ${getPosition(over.id)} of ${tiles.length}`;
      }

      return;
    },
    onDragEnd: ({ active, over }) => {
      if (over) {
        return `Sortable item ${active.id} was dropped at position ${getPosition(over.id)} of ${tiles.length}`;
      }

      return;
    },

    onDragCancel: ({ active }) => {
      return `Sorting was cancelled. Sortable item ${active.id} was dropped and returned to position ${getPosition(active.id)} of ${tiles.length}.`;
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
    useSensor(MouseSensor),
    useSensor(TouchSensor),
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
        const tilesOrdered = arrayMove(tiles, activeIndex, overIndex);

        const keys = {
          tiles: userKeys.dashboardTiles(user.data.id).queryKey,
        } as const;

        queryClient.setQueryData(keys.tiles, (tiles) => {
          if (!tiles) {
            return tiles;
          }

          return tilesOrdered;
        });

        udpateDashboardTilesOrder.mutate({ data: tilesOrdered });
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
      <SortableContext items={tiles} strategy={rectSortingStrategy}>
        {tiles.map((item) => (
          <Fragment key={item.id}>{props.children(item)}</Fragment>
        ))}
      </SortableContext>
    </DndContext>
  );
};

const Tile = (props: TileProps) => {
  switch (props.tile.type) {
    case "exercise":
      return <ExerciseTile tile={props.tile} />;
    case "exercisesFrequency":
      return <ExercisesFrequencyTile tile={props.tile} />;
    case "tagsFrequency":
      return <TagsFrequencyTile tile={props.tile} />;
    case "exercisesFunFacts":
      return <ExercisesFunFactsTile tile={props.tile} />;
    case "setsHeatMap":
      return <SetsHeatMapTile tile={props.tile} />;
  }

  props.tile.type satisfies never;
};

const ExerciseTile = (props: TileProps) => {
  const sortable = useSortable({ id: props.tile.id });

  if (!props.tile.exercise) {
    throw new Error("no exercise");
  }

  const style: Readonly<CSSProperties> = {
    transform: sortable.transform
      ? `translate3d(${sortable.transform.x ? Math.round(sortable.transform.x) : 0}px, ${sortable.transform.y ? Math.round(sortable.transform.y) : 0}px, 0)`
      : undefined,
    transition: sortable.transition,
    zIndex: sortable.isDragging ? "100" : "auto",
  };

  return (
    <Card ref={sortable.setNodeRef} style={style}>
      <Button variant="link" asChild className="absolute inset-0 h-auto">
        <Link
          to="/exercises/$exerciseId"
          params={{ exerciseId: props.tile.exercise.id }}
          aria-label={`go to exercise ${props.tile.exercise.id}`}
        />
      </Button>

      <CardHeader>
        <Name>{props.tile.exercise.name}</Name>
        <Button
          size="icon"
          variant="ghost"
          className="opacity-full-on-touch-device z-10 cursor-grab opacity-0 transition-opacity focus-visible:opacity-100 active:cursor-grabbing group-hover:opacity-100"
          aria-label="drag tile"
          {...sortable.listeners}
          {...sortable.attributes}
          suppressHydrationWarning
        >
          <GripVertical className="!size-3" />
        </Button>
      </CardHeader>

      <ExerciseOverviewGraph sets={props.tile.exercise.sets} />
    </Card>
  );
};

const TagsFrequencyTile = (props: TileProps) => {
  const sortable = useSortable({ id: props.tile.id });

  const style: Readonly<CSSProperties> = {
    transform: sortable.transform
      ? `translate3d(${sortable.transform.x ? Math.round(sortable.transform.x) : 0}px, ${sortable.transform.y ? Math.round(sortable.transform.y) : 0}px, 0)`
      : undefined,
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
          className="opacity-full-on-touch-device z-10 cursor-grab opacity-0 transition-opacity focus-visible:opacity-100 active:cursor-grabbing group-hover:opacity-100"
          aria-label="drag tile"
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
  const sortable = useSortable({ id: props.tile.id });

  const tiles = useGridTiles();
  const data = tiles
    .filter((tile) => tile.exercise != null)
    .map((tile) => {
      if (!tile.exercise) {
        throw new Error("no tile.exercise");
      }

      return {
        frequency: tile.exercise.sets.length,
        name: tile.exercise.name,
      };
    });

  const style: Readonly<CSSProperties> = {
    transform: sortable.transform
      ? `translate3d(${sortable.transform.x ? Math.round(sortable.transform.x) : 0}px, ${sortable.transform.y ? Math.round(sortable.transform.y) : 0}px, 0)`
      : undefined,
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
          className="opacity-full-on-touch-device z-10 cursor-grab opacity-0 transition-opacity focus-visible:opacity-100 active:cursor-grabbing group-hover:opacity-100"
          aria-label="drag tile"
          {...sortable.listeners}
          {...sortable.attributes}
          suppressHydrationWarning
        >
          <GripVertical className="!size-3" />
        </Button>
      </CardHeader>

      <ExercisesRadarGraph data={data} />
    </Card>
  );
};

const ExercisesFunFactsTile = (props: TileProps) => {
  const sortable = useSortable({ id: props.tile.id });
  const tiles = useGridTiles();
  const exercises = tiles
    .filter((tile) => Boolean(tile.exercise))
    .flatMap((tile) => {
      if (!tile.exercise) {
        throw new Error("no tile.exercise");
      }
      return tile.exercise;
    });

  const style: Readonly<CSSProperties> = {
    transform: sortable.transform
      ? `translate3d(${sortable.transform.x ? Math.round(sortable.transform.x) : 0}px, ${sortable.transform.y ? Math.round(sortable.transform.y) : 0}px, 0)`
      : undefined,
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
          className="opacity-full-on-touch-device z-10 cursor-grab opacity-0 transition-opacity focus-visible:opacity-100 active:cursor-grabbing group-hover:opacity-100"
          aria-label="drag tile"
          {...sortable.listeners}
          {...sortable.attributes}
          suppressHydrationWarning
        >
          <GripVertical className="!size-3" />
        </Button>
      </CardHeader>

      <ExercisesFunFacts exercises={exercises} />
    </Card>
  );
};

const SetsHeatMapTile = (props: TileProps) => {
  const sortable = useSortable({ id: props.tile.id });
  const tiles = useGridTiles();
  const exercises = tiles
    .filter((tile) => Boolean(tile.exercise))
    .flatMap((tile) => {
      if (!tile.exercise) {
        throw new Error("no tile.exercise");
      }
      return tile.exercise;
    });

  const monthName = new Date().toLocaleString("default", { month: "long" });

  const style: Readonly<CSSProperties> = {
    transform: sortable.transform
      ? `translate3d(${sortable.transform.x ? Math.round(sortable.transform.x) : 0}px, ${sortable.transform.y ? Math.round(sortable.transform.y) : 0}px, 0)`
      : undefined,
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
          className="opacity-full-on-touch-device z-10 cursor-grab opacity-0 transition-opacity focus-visible:opacity-100 active:cursor-grabbing group-hover:opacity-100"
          aria-label="drag tile"
          {...sortable.listeners}
          {...sortable.attributes}
          suppressHydrationWarning
        >
          <GripVertical className="!size-3" />
        </Button>
      </CardHeader>

      <SetsHeatMapGraph exercises={exercises} />
    </Card>
  );
};

type Tile = Readonly<ReturnType<typeof useGridTiles>[number]>;
type TileProps = Readonly<{ tile: Tile }>;

const useGridTiles = () => {
  const tiles = useDashboardTiles();

  if (!tiles.data.length) {
    return [];
  }

  return tiles.data;
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
