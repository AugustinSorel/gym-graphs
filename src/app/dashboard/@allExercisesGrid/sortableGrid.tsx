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
import { useEffect, useState } from "react";
import type { PropsWithChildren, ReactNode } from "react";
import { Slot } from "@radix-ui/react-slot";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateExercisesGridIndex } from "@/serverActions/exercises";
import { useSession } from "next-auth/react";

type Props = {
  gridItems: { render: ReactNode; id: string }[];
};

export const SortableGrid = (props: Props) => {
  const [gridItems, setGridItems] = useState(props.gridItems);
  const { data: session } = useSession();

  useEffect(() => setGridItems(props.gridItems), [props.gridItems]);

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id === over?.id || !session) {
      return;
    }

    const oldIndex = gridItems.findIndex((x) => x.id === active?.id);
    const newIndex = gridItems.findIndex((x) => x.id === over?.id);

    const updatedGridItems = arrayMove(gridItems, oldIndex, newIndex);

    setGridItems(updatedGridItems);

    updateExercisesGridIndex({
      userId: session?.user.id,
      exercisesId: updatedGridItems.map((item) => item.id),
    });
  };

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

export const DragComponent = ({ id }: { id: string }) => {
  const { attributes, listeners } = useSortable({ id });

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            className="h-8 cursor-grab p-1 active:cursor-grabbing"
            size="icon"
            variant="ghost"
            aria-label="drag exercise in the grid"
            {...attributes}
            {...listeners}
            suppressHydrationWarning
          >
            <GripVertical className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent className="active:opacity-0">
          <p className="capitalize">drag exercise</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
