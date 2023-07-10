"use client";

import { DashboardGrid } from "./exercisesGrid";
import ExerciseCard from "./exerciseCard";
import {
  closestCenter,
  useSensor,
  useSensors,
  DndContext,
  TouchSensor,
  MouseSensor,
  DragOverlay,
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable";
import { useCallback, useState } from "react";
import type { PropsWithChildren } from "react";
import type { Exercise } from "@/fakeData";
import { GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slot } from "@radix-ui/react-slot";
import {
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Tooltip,
} from "@/components/ui/tooltip";

export const SortableGrid = ({ exercises }: { exercises: Exercise[] }) => {
  const [items, setItems] = useState(exercises);
  const [activeId, setActiveId] = useState<Exercise["id"] | null>(null);

  //TODO:keyboard navigation
  const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor));

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (active.id !== over?.id) {
        setItems((prev) => {
          const oldIndex = items.findIndex(
            (exercise) => exercise.id === active?.id
          );
          const newIndex = items.findIndex(
            (exercise) => exercise.id === over?.id
          );

          return arrayMove(prev, oldIndex, newIndex);
        });

        setActiveId(null);
      }
    },
    [items]
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id.toString());
  }, []);

  const handleDragCancel = useCallback(() => {
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
      <SortableContext items={items} strategy={rectSortingStrategy}>
        <DashboardGrid>
          {items.map((exercise) => (
            <SortableItem key={exercise.id} id={exercise.id}>
              <ExerciseCard
                exercise={exercise}
                dragComponent={<DragComponent id={exercise.id} />}
              />
            </SortableItem>
          ))}
        </DashboardGrid>
      </SortableContext>

      <DragOverlay adjustScale style={{ transformOrigin: "0 0 " }}>
        {activeId ? (
          <ExerciseCard
            exercise={
              items.find((e) => e.id === activeId) ?? {
                gridIndex: 0,
                id: "",
                data: [],
                name: "",
              }
            }
            dragComponent={<DragComponent id={activeId} />}
          />
        ) : null}
      </DragOverlay>
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
        zIndex: isDragging ? "20" : "0",
        opacity: isDragging ? "0.5" : "1",
        transition,
        transform: transform
          ? `translate3d(${transform?.x}px, ${transform?.y}px, 0) scaleX(${transform?.scaleX})  scaleY(${transform?.scaleY})`
          : undefined,
      }}
    >
      {props.children}
    </Slot>
  );
};

//TODO:remove hover when drags
const DragComponent = (props: { id: string } & PropsWithChildren) => {
  const { attributes, listeners } = useSortable({ id: props.id });

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            className="z-10 h-8 cursor-grab p-1 active:cursor-grabbing"
            size="icon"
            variant="ghost"
            aria-label="drag exercise in the grid"
            {...listeners}
            {...attributes}
            aria-describedby="DndDescribedBy-1"
          >
            <GripVertical className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="capitalize">drag exercise</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
