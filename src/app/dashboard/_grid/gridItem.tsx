import Link from "next/link";
import type { LinkProps } from "next/link";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
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
import type { ComponentProps } from "react";
import { forwardRef } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const Header = (props: ComponentProps<"header">) => {
  return (
    <header
      {...props}
      className="flex h-14 items-center gap-2 border-b border-border bg-primary px-2"
    />
  );
};

const ActionContainer = (props: ComponentProps<"div">) => {
  return (
    <div
      {...props}
      className="opacity-full-on-touch-device z-10 opacity-0 transition-all duration-100 group-focus-within:opacity-100 group-hover:opacity-100"
    />
  );
};

const Title = (props: ComponentProps<"p">) => {
  return <p {...props} className="mr-auto truncate capitalize" />;
};

const Anchor = (props: LinkProps) => {
  return <Link {...props} className="absolute inset-0" />;
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

const Container = forwardRef<HTMLLIElement, ComponentProps<"li">>(
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
Container.displayName = "GridItem";

export const GridItem = Object.assign(Container, {
  Header,
  ActionContainer,
  Title,
  Anchor,
  ExerciseDropDown,
});
