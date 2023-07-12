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
import { type Exercise } from "@/fakeData";
import { GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slot } from "@radix-ui/react-slot";
import {
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Tooltip,
} from "@/components/ui/tooltip";
import { LineGraph, type LineGraphData } from "./lineGraph";
import { type RadarGraphData, RadarGraph } from "./radarGraph";
import { keepDataFrom30Days } from "@/lib/date";

export const SortableGrid = ({ exercises }: { exercises: Exercise[] }) => {
  const [activeId, setActiveId] = useState<Exercise["id"] | null>(null);
  const [gridItems, setGridItems] = useState<GridItem[]>(
    getGridItems(exercises)
  );

  const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor));

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (active.id !== over?.id) {
        setGridItems((prev) => {
          const oldIndex = gridItems.findIndex(
            (exercise) => exercise.id === active?.id
          );
          const newIndex = gridItems.findIndex(
            (exercise) => exercise.id === over?.id
          );

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
        <DashboardGrid>
          {gridItems.map((exercise) => (
            <SortableItem key={exercise.id} id={exercise.id}>
              <ExerciseCard
                exerciseName={exercise.name}
                dragComponent={<DragComponent id={exercise.id} />}
              >
                <CardGraph item={exercise} />
              </ExerciseCard>
            </SortableItem>
          ))}
        </DashboardGrid>
      </SortableContext>

      <DragOverlay adjustScale style={{ transformOrigin: "0 0 " }}>
        {activeId && (
          <ExerciseCard
            exerciseName={gridItems.find((e) => e.id === activeId)?.name ?? ""}
            dragComponent={<DragComponent id={activeId} disableTooltip />}
          >
            <CardGraph item={gridItems.find((e) => e.id === activeId)} />
          </ExerciseCard>
        )}
      </DragOverlay>
    </DndContext>
  );
};

type GridItem = { id: string; name: string; gridIndex: number } & (
  | {
      itemType: "line";
      data: LineGraphData[];
    }
  | {
      itemType: "radar";
      data: RadarGraphData[];
    }
);

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

const CardGraph = ({ item }: { item: GridItem }) => {
  if (item.itemType === "radar") {
    return <RadarGraph data={item.data} />;
  }

  return <LineGraph data={item.data} />;
};

const DragComponent = ({
  id,
  disableTooltip = false,
}: {
  id: string;
  disableTooltip?: boolean;
}) => {
  const { attributes, listeners } = useSortable({ id });
  const [isOpen, setIsOpen] = useState(false);

  return (
    <TooltipProvider>
      <Tooltip open={isOpen && !disableTooltip} onOpenChange={setIsOpen}>
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
