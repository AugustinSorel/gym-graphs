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
import { Skeleton } from "~/ui/skeleton";
import type {
  ComponentProps,
  CSSProperties,
  PropsWithChildren,
  ReactNode,
} from "react";
import type { ErrorComponentProps } from "@tanstack/react-router";
import type {
  DragStartEvent,
  ScreenReaderInstructions,
  UniqueIdentifier,
} from "@dnd-kit/core";

export const ExercisesGrid = () => {
  const tiles = useDashboardTiles();

  if (!tiles.data.length) {
    return <NoExercisesText>no exercises</NoExercisesText>;
  }

  return (
    <Grid>
      <SortableGrid>
        {(tile, index) => (
          <CatchBoundary
            errorComponent={ExerciseFallback}
            getResetKey={() => "reset"}
            key={tile.id}
          >
            <SortableItem
              isLastItem={index >= tiles.data.length - 1}
              id={tile.id}
            >
              <Tile tile={tile} />
            </SortableItem>
          </CatchBoundary>
        )}
      </SortableGrid>

      {tiles.isFetchingNextPage && <SkeletonTiles />}
    </Grid>
  );
};

const SortableItem = (
  props: Readonly<PropsWithChildren<{ isLastItem: boolean; id: number }>>,
) => {
  const sortable = useSortable({ id: props.id });
  const tiles = useDashboardTiles();

  const style: Readonly<CSSProperties> = {
    transform: sortable.transform
      ? `translate3d(${sortable.transform.x ? Math.round(sortable.transform.x) : 0}px, ${sortable.transform.y ? Math.round(sortable.transform.y) : 0}px, 0)`
      : undefined,
    transition: sortable.transition,
    zIndex: sortable.isDragging ? "100" : "auto",
  };

  const fetchNextPageHandler = (e: HTMLElement) => {
    if (!props.isLastItem) {
      return () => null;
    }

    const observer = new IntersectionObserver(([tile]) => {
      if (!tile?.isIntersecting || !tiles.hasNextPage) {
        return;
      }

      tiles.fetchNextPage();
    });

    observer.observe(e);

    return () => observer.unobserve(e);
  };

  return (
    <div
      role="listitem"
      ref={(e) => {
        sortable.setNodeRef(e);

        if (!e) {
          return;
        }

        const tearDownHandler = fetchNextPageHandler(e);

        return () => {
          tearDownHandler();
        };
      }}
      style={style}
    >
      {props.children}
    </div>
  );
};

const SortableGrid = (props: {
  children: (tile: Tile, index: number) => ReactNode;
}) => {
  const tiles = useDashboardTiles();
  const user = useUser();
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const isFirstAnnouncement = useRef(true);
  const udpateDashboardTilesOrder = useUpdateDashboardTilesOrder();
  const queryClient = useQueryClient();

  const getIndex = (id: UniqueIdentifier) => {
    return tiles.data.findIndex((tile) => tile.id === id);
  };

  const getPosition = (id: UniqueIdentifier) => {
    return getIndex(id) + 1;
  };

  const activeIndex = activeId != null ? getIndex(activeId) : -1;

  const announcements: Readonly<Announcements> = {
    onDragStart: ({ active }) => {
      return `Picked up sortable item ${active.id}. Sortable item ${active.id} is in position ${getPosition(active.id)} of ${tiles.data.length}`;
    },

    onDragOver: ({ active, over }) => {
      if (isFirstAnnouncement.current === true) {
        isFirstAnnouncement.current = false;
        return;
      }

      if (over) {
        return `Sortable item ${active.id} was moved into position ${getPosition(over.id)} of ${tiles.data.length}`;
      }

      return;
    },
    onDragEnd: ({ active, over }) => {
      if (over) {
        return `Sortable item ${active.id} was dropped at position ${getPosition(over.id)} of ${tiles.data.length}`;
      }

      return;
    },

    onDragCancel: ({ active }) => {
      return `Sorting was cancelled. Sortable item ${active.id} was dropped and returned to position ${getPosition(active.id)} of ${tiles.data.length}.`;
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
        const tilesOrdered = arrayMove(tiles.data, activeIndex, overIndex);

        const keys = {
          tiles: userKeys.dashboardTiles(user.data.id).queryKey,
        } as const;

        queryClient.setQueryData(keys.tiles, (tiles) => {
          if (!tiles) {
            return tiles;
          }

          return {
            ...tiles,
            pages: tiles.pages.map((page, i) => {
              return {
                ...page,
                tiles: page.tiles.map((_tile, j) => {
                  const tile = tilesOrdered.at(i * page.tiles.length + j);

                  if (!tile) {
                    throw new Error("tile not found when reordering");
                  }

                  return tile;
                }),
              };
            }),
          };
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
      <SortableContext items={tiles.data} strategy={rectSortingStrategy}>
        {tiles.data.map((item, index) => (
          <Fragment key={item.id}>{props.children(item, index)}</Fragment>
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

  return (
    <Card>
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
          className="opacity-full-on-touch-device z-10 cursor-grab opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 active:cursor-grabbing"
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

  return (
    <Card>
      <CardHeader>
        <Name>tags frequency</Name>
        <Button
          size="icon"
          variant="ghost"
          className="opacity-full-on-touch-device z-10 cursor-grab opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 active:cursor-grabbing"
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

  const tiles = useDashboardTiles();
  const data = tiles.data
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

  return (
    <Card>
      <CardHeader>
        <Name>exercises frequency</Name>
        <Button
          size="icon"
          variant="ghost"
          className="opacity-full-on-touch-device z-10 cursor-grab opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 active:cursor-grabbing"
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
  const tiles = useDashboardTiles();
  const exercises = tiles.data
    .filter((tile) => Boolean(tile.exercise))
    .flatMap((tile) => {
      if (!tile.exercise) {
        throw new Error("no tile.exercise");
      }
      return tile.exercise;
    });

  return (
    <Card>
      <CardHeader>
        <Name>fun facts</Name>
        <Button
          size="icon"
          variant="ghost"
          className="opacity-full-on-touch-device z-10 cursor-grab opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 active:cursor-grabbing"
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
  const tiles = useDashboardTiles();
  const exercises = tiles.data
    .filter((tile) => Boolean(tile.exercise))
    .flatMap((tile) => {
      if (!tile.exercise) {
        throw new Error("no tile.exercise");
      }
      return tile.exercise;
    });

  const monthName = new Date().toLocaleString("default", { month: "long" });

  return (
    <Card>
      <CardHeader>
        <Name>Heat map - {monthName}</Name>
        <Button
          size="icon"
          variant="ghost"
          className="opacity-full-on-touch-device z-10 cursor-grab opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 active:cursor-grabbing"
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

const SkeletonTiles = () => {
  return [...new Array(10).keys()].map((i) => (
    <Skeleton key={i}>
      <Card>
        <CardHeader className="h-16" />
      </Card>
    </Skeleton>
  ));
};

type Tile = Readonly<ReturnType<typeof useDashboardTiles>["data"][number]>;
type TileProps = Readonly<{ tile: Tile }>;

const useUpdateDashboardTilesOrder = () => {
  return useMutation({
    mutationFn: updateDashboardTilesOrderAction,
  });
};

const Grid = (props: ComponentProps<"div">) => {
  return (
    <div
      role="list"
      aria-sort="descending"
      className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,var(--dashboard-card-width)),1fr))] gap-5"
      {...props}
    />
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

const ExerciseFallback = (props: ErrorComponentProps) => {
  return (
    <Card className="border-destructive bg-destructive/10">
      <header className="border-destructive border-b p-4">
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
      className="bg-secondary flex h-32 items-center justify-center rounded-md border"
      {...props}
    />
  );
};
