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
import {
  useMutation,
  useQueryClient,
  useSuspenseInfiniteQuery,
} from "@tanstack/react-query";
import { callApi, InferApiProps } from "~/libs/api";
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
import { exerciseQueries } from "~/domains/exercise/exercise.queries";
import { SelectAllExercisesSuccess } from "@gym-graphs/shared/exercise/schemas";
import {
  ExerciseCard,
  ExerciseCardFallback,
  ExerciseCardSkeleton,
} from "~/domains/exercise/components/exercise-card";

export const ExercisesGrid = () => {
  return (
    <NoExercisesFallback>
      <CatchBoundary
        errorComponent={DefaultFallback}
        getResetKey={() => "reset"}
      >
        <Suspense fallback={<ExercisesGridSkeleton />}>
          <Content />
        </Suspense>
      </CatchBoundary>
    </NoExercisesFallback>
  );
};

const NoExercisesFallback = (props: PropsWithChildren) => {
  const search = useSearch({ from: "/(authed)/exercises/" });
  const exercises = useSuspenseInfiniteQuery(exerciseQueries.all(search));

  if (!exercises.data.length) {
    return <NoDataText>no data</NoDataText>;
  }

  return props.children;
};

const Content = () => {
  const search = useSearch({ from: "/(authed)/exercises/" });
  const exercises = useSuspenseInfiniteQuery(exerciseQueries.all(search));

  return (
    <Grid>
      <SortableGrid>
        {(exercise, index) => (
          <CatchBoundary
            errorComponent={ExerciseCardFallback}
            getResetKey={() => "reset"}
            key={exercise.id}
          >
            <SortableItem
              isLastItem={index >= exercises.data.length - 1}
              id={exercise.id}
            >
              <ExerciseCard exercise={exercise} />
            </SortableItem>
          </CatchBoundary>
        )}
      </SortableGrid>

      {exercises.isFetchingNextPage && <ExercisesSkeleton />}
    </Grid>
  );
};

const SortableItem = (
  props: Readonly<PropsWithChildren<{ isLastItem: boolean; id: number }>>,
) => {
  const sortable = useSortable({ id: props.id });
  const search = useSearch({ from: "/(authed)/exercises/" });
  const exercises = useSuspenseInfiniteQuery(exerciseQueries.all(search));

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

    const observer = new IntersectionObserver(([card]) => {
      if (!card?.isIntersecting || !exercises.hasNextPage) {
        return;
      }

      void exercises.fetchNextPage();
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
  children: (exercise: Exercise, index: number) => ReactNode;
}) => {
  const search = useSearch({ from: "/(authed)/exercises/" });
  const exercises = useSuspenseInfiniteQuery(exerciseQueries.all(search));
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const isFirstAnnouncement = useRef(true);
  const reorderExercises = useReorderExercises();
  const queryClient = useQueryClient();

  const getIndex = (id: UniqueIdentifier) => {
    return exercises.data.findIndex((exercise) => exercise.id === id);
  };

  const getPosition = (id: UniqueIdentifier) => {
    return getIndex(id) + 1;
  };

  const activeIndex = activeId != null ? getIndex(activeId) : -1;

  const announcements: Readonly<Announcements> = {
    onDragStart: ({ active }) => {
      return `Picked up sortable item ${active.id}. Sortable item ${active.id} is in position ${getPosition(active.id)} of ${exercises.data.length}`;
    },

    onDragOver: ({ active, over }) => {
      if (isFirstAnnouncement.current === true) {
        isFirstAnnouncement.current = false;
        return;
      }

      if (over) {
        return `Sortable item ${active.id} was moved into position ${getPosition(over.id)} of ${exercises.data.length}`;
      }

      return;
    },
    onDragEnd: ({ active, over }) => {
      if (over) {
        return `Sortable item ${active.id} was dropped at position ${getPosition(over.id)} of ${exercises.data.length}`;
      }

      return;
    },

    onDragCancel: ({ active }) => {
      return `Sorting was cancelled. Sortable item ${active.id} was dropped and returned to position ${getPosition(active.id)} of ${exercises.data.length}.`;
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

    const exercisesOrdered = arrayMove(exercises.data, activeIndex, overIndex);

    const queries = {
      exercises: exerciseQueries.all().queryKey,
    };

    queryClient.setQueryData(queries.exercises, (exercises) => {
      if (!exercises) {
        return exercises;
      }

      return {
        ...exercises,
        pages: exercises.pages.map((page, i) => {
          return {
            ...page,
            exercises: page.exercises.map((_exercise, j) => {
              const exercise = exercisesOrdered.at(
                i * page.exercises.length + j,
              );

              if (!exercise) {
                throw new Error("exercise not found when reordering");
              }

              return exercise;
            }),
          };
        }),
      };
    });

    reorderExercises.mutate({
      payload: {
        exerciseIds: exercisesOrdered.map((exercise) => exercise.id),
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
      <SortableContext items={exercises.data} strategy={rectSortingStrategy}>
        {exercises.data.map((item, index) => (
          <Fragment key={item.id}>{props.children(item, index)}</Fragment>
        ))}
      </SortableContext>
    </DndContext>
  );
};

const ExercisesSkeleton = () => {
  return [...new Array(10).keys()].map((i) => (
    <ExerciseCardSkeleton key={`skeleton-${i}`} />
  ));
};

const ExercisesGridSkeleton = () => {
  return (
    <Grid>
      <ExercisesSkeleton />
    </Grid>
  );
};

type Exercise = (typeof SelectAllExercisesSuccess.Type)["exercises"][number];

const useReorderExercises = () => {
  return useMutation({
    mutationFn: async (props: InferApiProps<"Exercise", "reorder">) => {
      return callApi((api) => api.Exercise.reorder(props));
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
