"use client";

import { Button } from "@/components/ui/button";
import { Edit2, MoreHorizontal, Trash } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UpdateExerciseNameForm } from "./updateExerciseNameForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import type { ComponentProps } from "react";

type Props = {
  updateExerciseNameFormAction: ComponentProps<
    typeof UpdateExerciseNameForm
  >["onAction"];
};

//FIXME: remove warning
export const CardDropDown = ({ updateExerciseNameFormAction }: Props) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="h-8 p-1 opacity-0 transition-all duration-100 group-focus-within:opacity-100 group-hover:opacity-100 aria-[expanded=true]:opacity-100"
            size="icon"
            variant="ghost"
            aria-label="view more about the exercise bench press"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel className="capitalize">settings</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DialogTrigger asChild>
              <DropdownMenuItem>
                <Edit2 className="mr-2 h-4 w-4" />
                <span className="capitalize">rename</span>
              </DropdownMenuItem>
            </DialogTrigger>
            <DropdownMenuItem className="text-destructive/80 focus:bg-destructive/20 focus:text-destructive">
              <Trash className="mr-2 h-4 w-4" />
              <span className="capitalize">delete exercise</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <DialogContent className="space-y-5 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="capitalize">change exercise name</DialogTitle>
        </DialogHeader>
        <UpdateExerciseNameForm
          onAction={updateExerciseNameFormAction}
          onSuccesss={() => setIsDialogOpen(() => false)}
        />
      </DialogContent>
    </Dialog>
  );
};
