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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { Loader } from "@/components/ui/loader";

type Props = {
  updateExerciseNameFormAction: ComponentProps<
    typeof UpdateExerciseNameForm
  >["onAction"];
};

//FIXME: remove warning
export const CardDropDown = ({ updateExerciseNameFormAction }: Props) => {
  const exercise = "bench press";
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const [isDeleteExerciseLoading, setIsDeleteExerciseLoading] = useState(false);
  const { toast } = useToast();

  const deleteHandler = async () => {
    try {
      setIsDeleteExerciseLoading(() => true);
      await new Promise((res) => setTimeout(res, 1_000));
      setIsAlertDialogOpen(() => false);
    } catch (error) {
      return toast({
        variant: "destructive",
        title: "Something went wrong",
        description: error instanceof Error ? error.message : "try again",
        action: (
          <ToastAction altText="Try again" onClick={() => void deleteHandler()}>
            Try again
          </ToastAction>
        ),
      });
    } finally {
      setIsDeleteExerciseLoading(() => false);
    }
  };

  return (
    <AlertDialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
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
            <DropdownMenuLabel className="capitalize">
              settings
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DialogTrigger asChild>
                <DropdownMenuItem>
                  <Edit2 className="mr-2 h-4 w-4" />
                  <span className="capitalize">rename</span>
                </DropdownMenuItem>
              </DialogTrigger>

              <AlertDialogTrigger asChild>
                <DropdownMenuItem className="text-destructive/80 focus:bg-destructive/20 focus:text-destructive">
                  <Trash className="mr-2 h-4 w-4" />
                  <span className="capitalize">delete exercise</span>
                </DropdownMenuItem>
              </AlertDialogTrigger>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DialogContent className="space-y-5 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="capitalize">
              change exercise name
            </DialogTitle>
          </DialogHeader>
          <UpdateExerciseNameForm
            onAction={updateExerciseNameFormAction}
            onSuccesss={() => setIsDialogOpen(() => false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete{" "}
            {exercise} from your exercise list
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="capitalize">cancel</AlertDialogCancel>
          <AlertDialogAction
            className="space-x-2 bg-destructive text-destructive-foreground hover:bg-destructive/80"
            onClick={(e) => {
              e.preventDefault();
              void deleteHandler();
            }}
          >
            {isDeleteExerciseLoading && <Loader />}
            <span className="capitalize">delete</span>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
