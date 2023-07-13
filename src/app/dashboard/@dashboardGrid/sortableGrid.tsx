"use client";

import { GridLayout } from "./gridLayout";
import {
  closestCenter,
  useSensor,
  useSensors,
  DndContext,
  TouchSensor,
  MouseSensor,
  DragOverlay,
  KeyboardSensor,
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { useCallback, useState } from "react";
import type { PropsWithChildren } from "react";
import { type Exercise } from "@/fakeData";
import { keepDataFrom30Days } from "@/lib/date";
import type { GridItemType } from "./gridItem";
import { GridItem } from "./gridItem";

export const SortableGrid = ({ exercises }: { exercises: Exercise[] }) => {
  const [activeId, setActiveId] = useState<Exercise["id"] | null>(null);
  const [gridItems, setGridItems] = useState<GridItemType[]>(
    getGridItems(exercises)
  );

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (active.id !== over?.id) {
        setGridItems((prev) => {
          const oldIndex = gridItems.findIndex((x) => x.id === active?.id);
          const newIndex = gridItems.findIndex((x) => x.id === over?.id);

          return arrayMove(prev, oldIndex, newIndex);
        });

        setActiveId(null);
      }
    },
    [gridItems]
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id.toString());
  }, []);

  const handleDragCancel = useCallback(() => {
    console.log("hell");

    setActiveId(null);
  }, []);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      onDragStart={handleDragStart}
    >
      <SortableContext items={gridItems} strategy={rectSortingStrategy}>
        <GridLayout>
          {gridItems.map((exercise) => (
            <SortableItem key={exercise.id} id={exercise.id}>
              <GridItem gridItem={exercise} />
            </SortableItem>
          ))}
        </GridLayout>
      </SortableContext>

      <DragOverlay adjustScale style={{ transformOrigin: "0 0 " }}>
        {activeId && (
          <GridItem
            gridItem={
              gridItems.find((e) => e.id === activeId) ?? {
                id: "-1",
                name: "",
                itemType: "line",
                data: [],
                gridIndex: -1,
              }
            }
          />
        )}
      </DragOverlay>
    </DndContext>
  );
};

const getGridItems = (exercises: Exercise[]) => {
  return [
    ...exercises.map((ex) => ({ ...ex, itemType: "line" as const })),
    {
      id: "radar",
      name: "radar",
      gridIndex: 0,
      itemType: "radar" as const,
      data: exercises.map((exercise) => ({
        exerciseName: exercise.name,
        frequency: keepDataFrom30Days(exercise.data).length,
      })),
    },
  ];
};

const SortableItem = (props: { id: string } & PropsWithChildren) => {
  const { setNodeRef, isDragging, transform, transition } = useSortable({
    id: props.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        opacity: isDragging ? "0.5" : "1",
        zIndex: isDragging ? 30 : 0,
        transition,
        transform: transform
          ? `translate3d(${transform?.x}px, ${transform?.y}px, 0) scaleX(${transform?.scaleX})  scaleY(${transform?.scaleY})`
          : undefined,
      }}
    >
      {props.children}
    </div>
  );
};
