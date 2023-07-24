"use client";

import { GridLayout } from "./gridLayout";
import {
  useSensor,
  useSensors,
  DndContext,
  TouchSensor,
  MouseSensor,
  KeyboardSensor,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
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
import { Slot } from "@radix-ui/react-slot";

export const SortableGrid = ({ exercises }: { exercises: Exercise[] }) => {
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
      }
    },
    [gridItems]
  );

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <SortableContext items={gridItems} strategy={rectSortingStrategy}>
        <GridLayout>
          {gridItems.map((exercise) => (
            <SortableItem key={exercise.id} id={exercise.id}>
              <GridItem gridItem={exercise} />
            </SortableItem>
          ))}
        </GridLayout>
      </SortableContext>
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
    <Slot
      ref={setNodeRef}
      style={{
        transition,
        zIndex: isDragging ? "20" : "1",
        transform: transform
          ? `translate3d(${transform?.x}px, ${transform?.y}px, 0) scaleX(${transform?.scaleX})  scaleY(${transform?.scaleY})`
          : undefined,
      }}
    >
      {props.children}
    </Slot>
  );
};
