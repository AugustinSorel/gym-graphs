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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { api } from "@/trpc/react";
import { useMutationState } from "@tanstack/react-query";
import { getQueryKey } from "@trpc/react-query";

type Props = {
  gridItems: { component: ReactNode; id: string }[];
};

export const SortableGrid = (props: Props) => {
  const [gridItems, setGridItems] = useState(props.gridItems);
  const utils = api.useUtils();

  const moveExercise = api.exercise.move.useMutation({
    onSettled: async () => {
      await utils.exercise.all.invalidate();
    },
  });

  useEffect(() => setGridItems(props.gridItems), [props.gridItems]);

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id === over?.id) {
      return;
    }

    const oldIndex = gridItems.findIndex((x) => x.id === active?.id);
    const newIndex = gridItems.findIndex((x) => x.id === over?.id);

    const updatedGridItems = arrayMove(gridItems, oldIndex, newIndex);

    setGridItems(updatedGridItems);

    moveExercise.mutate(updatedGridItems.map((item) => item.id));
  };

  return (
    <DndContext
      sensors={sensors}
      onDragEnd={(e) => void handleDragEnd(e)}
      collisionDetection={closestCenter}
    >
      <SortableContext items={gridItems} strategy={rectSortingStrategy}>
        {gridItems.map((item) => (
          <SortableItem key={item.id} id={item.id}>
            {item.component}
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
    <div
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
    </div>
  );
};

export const DragComponent = ({ id }: { id: string }) => {
  const { attributes, listeners } = useSortable({ id });

  const moveExerciseMutationState = useMutationState({
    filters: {
      mutationKey: getQueryKey(api.exercise.move),
    },
  });

  const isSavingGridState =
    moveExerciseMutationState.at(-1)?.status === "pending";

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
            disabled={isSavingGridState}
          >
            {isSavingGridState ? (
              <Loader />
            ) : (
              <GripVertical className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent className="active:opacity-0">
          <p className="capitalize">drag exercise</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
