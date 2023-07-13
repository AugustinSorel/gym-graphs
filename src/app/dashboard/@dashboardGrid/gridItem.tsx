import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GripVertical, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UpdateExerciseNameDialog } from "./updateExerciseNameDialog";
import { DeleteExerciseAlertDialog } from "./deleteExerciseAlertDialog";
import { deleteExerciseAction, updateExerciseNameAction } from "./actions";
import type { CSSProperties, HTMLAttributes } from "react";
import { forwardRef, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSortable } from "@dnd-kit/sortable";
import { RadarGraph, type RadarGraphData } from "./radarGraph";
import { LineGraph, type LineGraphData } from "./lineGraph";

export type GridItemType = { id: string; name: string; gridIndex: number } & (
  | {
      itemType: "line";
      data: LineGraphData[];
    }
  | {
      itemType: "radar";
      data: RadarGraphData[];
    }
);

type Props = {
  gridItem: GridItemType;
  style?: CSSProperties;
};

export const GridItem = forwardRef<HTMLLIElement, Props>(
  ({ gridItem, style }, ref) => {
    if (gridItem.itemType === "radar") {
      return (
        <GridItemContainer ref={ref} style={style}>
          <GridItemHeader>
            <GridItemTitle>{gridItem.name}</GridItemTitle>

            <GridItemActionsContainer>
              <DragComponent id={gridItem.id} />
            </GridItemActionsContainer>
          </GridItemHeader>

          <RadarGraph data={gridItem.data} />
        </GridItemContainer>
      );
    }

    return (
      <GridItemContainer ref={ref} style={style}>
        <Link
          href={`/exercises/${gridItem.name}`}
          className="absolute inset-0 duration-300"
          aria-label={`go to exercise ${gridItem.name}`}
        />

        <GridItemHeader>
          <GridItemTitle>{gridItem.name}</GridItemTitle>

          <GridItemActionsContainer>
            <ExerciseDropDown />
            <DragComponent id={gridItem.id} />
          </GridItemActionsContainer>
        </GridItemHeader>

        <LineGraph data={gridItem.data} />
      </GridItemContainer>
    );
  }
);
GridItem.displayName = "GridItem";

const GridItemContainer = forwardRef<
  HTMLLIElement,
  HTMLAttributes<HTMLLIElement>
>((props, ref) => {
  return (
    <li
      {...props}
      ref={ref}
      className="group relative flex h-exercise-card flex-col rounded-md border border-border bg-primary backdrop-blur-md hover:bg-border"
    />
  );
});
GridItemContainer.displayName = "x";

const GridItemHeader = (props: HTMLAttributes<HTMLHeadElement>) => {
  return (
    <header
      {...props}
      className="flex items-center gap-2 border-b border-border bg-primary p-2"
    />
  );
};

const GridItemActionsContainer = (props: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      {...props}
      className="z-10 transition-all duration-100 group-focus-within:opacity-100 group-hover:opacity-100 sm:opacity-0"
    />
  );
};

const GridItemTitle = (props: HTMLAttributes<HTMLParagraphElement>) => {
  return <p {...props} className="mr-auto truncate capitalize" />;
};

const DragComponent = ({ id }: { id: string }) => {
  const { attributes, listeners } = useSortable({ id });
  const [isOpen, setIsOpen] = useState(false);

  return (
    <TooltipProvider>
      <Tooltip open={isOpen} onOpenChange={setIsOpen}>
        <TooltipTrigger asChild>
          <Button
            className="h-8 cursor-grab p-1 active:cursor-grabbing"
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
        <TooltipContent className="active:opacity-0">
          <p className="capitalize">drag exercise</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const ExerciseDropDown = () => {
  return (
    <DropdownMenu>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                className="h-8 p-1"
                size="icon"
                variant="ghost"
                aria-label="view more about the exercise"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p className="capitalize">view more</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel className="capitalize">settings</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <UpdateExerciseNameDialog onAction={updateExerciseNameAction} />
          <DeleteExerciseAlertDialog onAction={deleteExerciseAction} />
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
