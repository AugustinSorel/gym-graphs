import { CatchBoundary } from "@tanstack/react-router";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { Fragment, Suspense, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTiles } from "~/dashboard/hooks/use-tiles";
import { dashboardQueries } from "~/dashboard/dashboard.queries";
import { reorderTilesAction } from "~/dashboard/dashboard.actions";
import {
  GraphTile,
  GraphTileFallback,
  GraphTileSkeleton,
} from "~/dashboard/components/graph-tile";
import {
  TrendingTile,
  TrendingTileFallback,
  TrendingTileSkeleton,
} from "~/dashboard/components/trending-tile";
import { useUser } from "~/user/hooks/use-user";
import type {
  ComponentProps,
  CSSProperties,
  PropsWithChildren,
  ReactNode,
} from "react";
import type {
  DragEndEvent,
  Announcements,
  DragStartEvent,
  ScreenReaderInstructions,
  UniqueIdentifier,
} from "@dnd-kit/core";

export const Dashboard = () => {
  return (
    <NoTilesFallback>
      <Content />
    </NoTilesFallback>
  );
};

const NoTilesFallback = (props: PropsWithChildren) => {
  const tiles = useTiles();

  if (!tiles.data.length) {
    return <NoDataText>no data</NoDataText>;
  }

  return props.children;
};

//TODO: refactor this with the new Activity Component
//      whenever it get released by React
const Content = () => {
  const user = useUser();

  if (user.data.dashboardView === "graph") {
    return (
      <Suspense fallback={<GraphContentSkeleton />}>
        <GraphContent />
      </Suspense>
    );
  }

  if (user.data.dashboardView === "trending") {
    return (
      <Suspense fallback={<TrendingContentSkeleton />}>
        <TrendingContent />
      </Suspense>
    );
  }

  user.data.dashboardView satisfies never;
};

const TrendingContent = () => {
  const tiles = useTiles();

  return (
    <Grid>
      <CatchBoundary
        errorComponent={TrendingTileFallback}
        getResetKey={() => "reset"}
      >
        {tiles.data.map((tile) => (
          <TrendingTile key={tile.id} tile={tile} />
        ))}
      </CatchBoundary>

      {tiles.isFetchingNextPage && <TrendingTilesSkeleton />}
    </Grid>
  );
};

const GraphContent = () => {
  const tiles = useTiles();

  return (
    <Grid>
      <SortableGrid>
        {(tile, index) => (
          <CatchBoundary
            errorComponent={GraphTileFallback}
            getResetKey={() => "reset"}
            key={tile.id}
          >
            <SortableItem
              isLastItem={index >= tiles.data.length - 1}
              id={tile.id}
            >
              <GraphTile tile={tile} />
            </SortableItem>
          </CatchBoundary>
        )}
      </SortableGrid>

      {tiles.isFetchingNextPage && <GraphTilesSkeleton />}
    </Grid>
  );
};

const SortableItem = (
  props: Readonly<PropsWithChildren<{ isLastItem: boolean; id: number }>>,
) => {
  const sortable = useSortable({ id: props.id });
  const tiles = useTiles();

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

      void tiles.fetchNextPage();
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
  const tiles = useTiles();
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const isFirstAnnouncement = useRef(true);
  const reorderTiles = useReorderTiles();
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

    if (!over) {
      return;
    }

    const overIndex = getIndex(over.id);

    if (activeIndex === overIndex) {
      return;
    }

    const tilesOrdered = arrayMove(tiles.data, activeIndex, overIndex);

    const queries = {
      tiles: dashboardQueries.tiles().queryKey,
    } as const;

    queryClient.setQueryData(queries.tiles, (tiles) => {
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

    reorderTiles.mutate({ data: tilesOrdered });
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

//TODO:
const GraphTilesSkeleton = () => {
  return [...new Array(10).keys()].map((i) => <GraphTileSkeleton key={i} />);
};

const TrendingTilesSkeleton = () => {
  return [...new Array(10).keys()].map((i) => <TrendingTileSkeleton key={i} />);
};

const GraphContentSkeleton = () => {
  return (
    <Grid>
      <GraphTilesSkeleton />
    </Grid>
  );
};

const TrendingContentSkeleton = () => {
  return (
    <Grid>
      <TrendingTilesSkeleton />
    </Grid>
  );
};

type Tile = Readonly<ReturnType<typeof useTiles>["data"][number]>;

const useReorderTiles = () => {
  return useMutation({
    mutationFn: reorderTilesAction,
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

const NoDataText = (props: ComponentProps<"p">) => {
  return (
    <p
      className="bg-secondary flex h-32 items-center justify-center rounded-md border"
      {...props}
    />
  );
};
