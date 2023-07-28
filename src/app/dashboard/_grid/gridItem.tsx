"use client";

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
import { UpdateExerciseNameDialog } from "../_modals/updateExerciseNameDialog";
import { DeleteExerciseAlertDialog } from "../_modals/deleteExerciseAlertDialog";
import {
  deleteExerciseAction,
  updateExerciseNameAction,
} from "@/serverActions/exercises";
import type { CSSProperties, HTMLAttributes, PropsWithChildren } from "react";
import { forwardRef, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSortable } from "@dnd-kit/sortable";

type Props = {
  id: string;
  title: string;
  isDraggable: boolean;
  isModifiable: boolean;
  href?: string;
  style?: CSSProperties;
} & PropsWithChildren;

export const GridItem = forwardRef<HTMLLIElement, Props>((props, ref) => {
  return (
    <Container ref={ref} style={props.style}>
      {props.href && (
        <Link
          href={props.href}
          className="absolute inset-0"
          aria-label={`go to exercise ${props.title}`}
        />
      )}

      <Header>
        <Title>{props.title}</Title>

        <ActionContainer>
          {props.isModifiable && <ExerciseDropDown />}
          {props.isDraggable && <DragComponent id={props.id} />}
        </ActionContainer>
      </Header>

      {props.children}
    </Container>
  );
});
GridItem.displayName = "GridItem";

const Container = forwardRef<HTMLLIElement, HTMLAttributes<HTMLLIElement>>(
  (props, ref) => {
    return (
      <li
        {...props}
        ref={ref}
        className="group relative flex h-exercise-card flex-col rounded-md border border-border bg-primary backdrop-blur-md hover:bg-border"
      />
    );
  }
);
Container.displayName = "x";

const Header = (props: HTMLAttributes<HTMLHeadElement>) => {
  return (
    <header
      {...props}
      className="flex h-14 items-center gap-2 border-b border-border bg-primary px-2"
    />
  );
};

const ActionContainer = (props: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      {...props}
      className="opacity-full-on-touch-device z-10 opacity-0 transition-all duration-100 group-focus-within:opacity-100 group-hover:opacity-100"
    />
  );
};

const Title = (props: HTMLAttributes<HTMLParagraphElement>) => {
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
