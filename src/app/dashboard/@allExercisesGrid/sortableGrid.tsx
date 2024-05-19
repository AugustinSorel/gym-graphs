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
import { Loader } from "@/components/ui/loader";
import { api } from "@/trpc/react";
import { useMutationState } from "@tanstack/react-query";
import { getQueryKey } from "@trpc/react-query";
import { useToast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";

type Props = {
  gridItems: { render: ReactNode; id: string }[];
};

export const SortableGrid = (props: Props) => {
  const [gridItems, setGridItems] = useState(props.gridItems);
  const { toast } = useToast();

  //TODO: performance
  const moveExercise = api.exercise.move.useMutation({
    onError: (error, variables) => {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: error.shape?.data.zodError?.fieldErrors?.name?.at(0),
        action: (
          <ToastAction
            altText="Try again"
            onClick={() => moveExercise.mutate(variables)}
          >
            Try again
          </ToastAction>
        ),
      });
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
