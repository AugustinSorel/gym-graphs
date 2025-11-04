import { CatchBoundary, useSearch } from "@tanstack/react-router";
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
import { useTiles } from "~/domains/tile/hooks/use-tiles";
import {
  GraphViewTile,
  GraphViewTileFallback,
  GraphViewTileSkeleton,
} from "~/domains/dashboard/components/graph-view-tile";
import {
  TrendingViewTile,
  TrendingViewTileFallback,
  TrendingViewTileSkeleton,
} from "~/domains/dashboard/components/trending-view-tile";
import { useUser } from "~/domains/user/hooks/use-user";
import { tileQueries } from "~/domains/tile/tile.queries";
import { api } from "~/libs/api";
import { parseJsonResponse } from "@gym-graphs/api";
import { DefaultFallback } from "~/ui/fallback";
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
import type { InferApiReqInput } from "@gym-graphs/api";

export const Dashboard = () => {
  return (
    <NoTilesFallback>
      <CatchBoundary
        errorComponent={DefaultFallback}
        getResetKey={() => "reset"}
      >
        <Content />
      </CatchBoundary>
    </NoTilesFallback>
  );
};

const NoTilesFallback = (props: PropsWithChildren) => {
  const search = useSearch({ from: "/(dashboard)/dashboard" });
  const tiles = useTiles(search.name, search.tags);

  if (!tiles.data.length) {
    return <NoDataText>no data</NoDataText>;
  }

  return props.children;
};

//TODO: refactor this with the new Activity Component
//      whenever it get released by React
const Content = () => {
  const user = useUser();

  switch (user.data.dashboardView) {
    case "graph": {
      return (
        <Suspense fallback={<GraphViewContentSkeleton />}>
          <GraphViewContent />
        </Suspense>
      );
    }
    case "trending": {
      return (
        <Suspense fallback={<TrendingViewContentSkeleton />}>
          <TrendingViewContent />
        </Suspense>
      );
    }
  }
};

const TrendingViewContent = () => {
  const search = useSearch({ from: "/(dashboard)/dashboard" });
  const tiles = useTiles(search.name, search.tags);

  return (
    <Grid>
      <CatchBoundary
        errorComponent={TrendingViewTileFallback}
        getResetKey={() => "reset"}
      >
        {tiles.data
          .filter((tile) => tile.type === "exerciseOverview")
          .map((tile) => {
            return <TrendingViewTile key={tile.id} tile={tile} />;
          })}
      </CatchBoundary>

      {tiles.isFetchingNextPage && <TrendingViewTilesSkeleton />}
    </Grid>
  );
};

const GraphViewContent = () => {
  const search = useSearch({ from: "/(dashboard)/dashboard" });
  const tiles = useTiles(search.name, search.tags);

  return (
    <Grid>
      <SortableGrid>
        {(tile, index) => (
          <CatchBoundary
            errorComponent={GraphViewTileFallback}
            getResetKey={() => "reset"}
            key={tile.id}
          >
            <SortableItem
              isLastItem={index >= tiles.data.length - 1}
              id={tile.id}
            >
              <GraphViewTile tile={tile} />
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
  const search = useSearch({ from: "/(dashboard)/dashboard" });
  const tiles = useTiles(search.name, search.tags);

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
  const search = useSearch({ from: "/(dashboard)/dashboard" });
  const tiles = useTiles(search.name, search.tags);
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
      tiles: tileQueries.all().queryKey,
    };

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

    reorderTiles.mutate({
      json: {
        tileIds: tilesOrdered.map((tile) => tile.id),
      },
    });
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

const GraphTilesSkeleton = () => {
  return [...new Array(10).keys()].map((i) => (
    <GraphViewTileSkeleton key={i} />
  ));
};

const TrendingViewTilesSkeleton = () => {
  return [...new Array(10).keys()].map((i) => (
    <TrendingViewTileSkeleton key={i} />
  ));
};

const GraphViewContentSkeleton = () => {
  return (
    <Grid>
      <GraphTilesSkeleton />
    </Grid>
  );
};

const TrendingViewContentSkeleton = () => {
  return (
    <Grid>
      <TrendingViewTilesSkeleton />
    </Grid>
  );
};

type Tile = Readonly<ReturnType<typeof useTiles>["data"][number]>;

const useReorderTiles = () => {
  const req = api().tiles.reorder.$put;

  return useMutation({
    mutationFn: async (input: InferApiReqInput<typeof req>) => {
      return parseJsonResponse(req(input));
    },
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
