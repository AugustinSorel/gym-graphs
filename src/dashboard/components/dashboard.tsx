import { CatchBoundary, getRouteApi } from "@tanstack/react-router";
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
  GridTile,
  GridTileFallback,
  GridTileSkeleton,
} from "~/dashboard/components/grid-tile";
import {
  ListTile,
  ListTileFallback,
  ListTileSkeleton,
} from "~/dashboard/components/list-tile";
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
  const search = routeApi.useSearch();

  const view = search.view ?? "grid";

  if (view === "grid") {
    return (
      <Suspense fallback={<GridSkeleton />}>
        <GridContent />
      </Suspense>
    );
  }

  if (view === "list") {
    return (
      <Suspense fallback={<ListSkeleton />}>
        <ListContent />
      </Suspense>
    );
  }

  view satisfies never;
};

const routeApi = getRouteApi("/(dashboard)/dashboard");

const ListContent = () => {
  const tiles = useTiles();

  return (
    <List>
      <SortableGrid>
        {(tile, index) => {
          if (!tile.exercise) {
            return null;
          }

          return (
            <CatchBoundary
              errorComponent={ListTileFallback}
              getResetKey={() => "reset"}
              key={tile.id}
            >
              <SortableItem
                isLastItem={index >= tiles.data.length - 1}
                id={tile.id}
              >
                <ListTile tile={tile} />
              </SortableItem>
            </CatchBoundary>
          );
        }}
      </SortableGrid>

      {tiles.isFetchingNextPage && <GridTilesSkeleton />}
    </List>
  );
};

const GridContent = () => {
  const tiles = useTiles();

  return (
    <Grid>
      <SortableGrid>
        {(tile, index) => (
          <CatchBoundary
            errorComponent={GridTileFallback}
            getResetKey={() => "reset"}
            key={tile.id}
          >
            <SortableItem
              isLastItem={index >= tiles.data.length - 1}
              id={tile.id}
            >
              <GridTile tile={tile} />
            </SortableItem>
          </CatchBoundary>
        )}
      </SortableGrid>

      {tiles.isFetchingNextPage && <GridTilesSkeleton />}
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

    if (over) {
      const overIndex = getIndex(over.id);

      if (activeIndex !== overIndex) {
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

const GridTilesSkeleton = () => {
  return [...new Array(10).keys()].map((i) => <GridTileSkeleton key={i} />);
};

const ListTilesSkeleton = () => {
  return [...new Array(10).keys()].map((i) => <ListTileSkeleton key={i} />);
};

const GridSkeleton = () => {
  return (
    <Grid>
      <GridTilesSkeleton />
    </Grid>
  );
};

const ListSkeleton = () => {
  return (
    <List>
      <ListTilesSkeleton />
    </List>
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

const List = (props: ComponentProps<"div">) => {
  return (
    <div
      role="list"
      aria-sort="descending"
      className="flex flex-col gap-5"
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
