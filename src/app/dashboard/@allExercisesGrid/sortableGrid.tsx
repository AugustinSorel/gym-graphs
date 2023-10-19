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
import { createContext, useContext, useEffect, useState } from "react";
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
import { Loader } from "@/components/ui/loader";

type Props = {
  gridItems: { render: ReactNode; id: string }[];
};

const SortableGridContext = createContext<{ isSavingGridState: boolean }>({
  isSavingGridState: false,
});

export const SortableGrid = (props: Props) => {
  const [gridItems, setGridItems] = useState(props.gridItems);
  const [isSavingGridState, setIsSavingGridState] = useState(false);

  const startSavingGridState = () => setIsSavingGridState(true);
  const stopSavingGridState = () => setIsSavingGridState(false);

  useEffect(() => setGridItems(props.gridItems), [props.gridItems]);

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id === over?.id) {
      return;
    }

    startSavingGridState();

    const oldIndex = gridItems.findIndex((x) => x.id === active?.id);
    const newIndex = gridItems.findIndex((x) => x.id === over?.id);

    const updatedGridItems = arrayMove(gridItems, oldIndex, newIndex);

    setGridItems(updatedGridItems);

    await updateExercisesGridIndex({
      exercisesId: updatedGridItems.map((item) => item.id),
    });

    stopSavingGridState();
  };

  return (
    <SortableGridContext.Provider value={{ isSavingGridState }}>
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
    </SortableGridContext.Provider>
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
  const { isSavingGridState } = useContext(SortableGridContext);

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
