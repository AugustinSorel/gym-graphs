"use client";

import {
  useSensor,
  useSensors,
  DndContext,
  TouchSensor,
  MouseSensor,
  KeyboardSensor,
  closestCenter,
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
import type { PropsWithChildren, ReactNode } from "react";
import { Slot } from "@radix-ui/react-slot";

type Props = {
  items: { render: ReactNode; id: string }[];
};

export const SortableGrid = ({ items }: Props) => {
  const [gridItems, setGridItems] = useState(items);

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
    <DndContext
      sensors={sensors}
      onDragEnd={handleDragEnd}
      collisionDetection={closestCenter}
    >
      <SortableContext items={gridItems} strategy={rectSortingStrategy}>
        {gridItems.map((item) => (
          <SortableItem key={item.id} id={item.id}>
            {item.render}
          </SortableItem>
        ))}
      </SortableContext>
    </DndContext>
  );
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
