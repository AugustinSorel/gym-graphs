"use client";

import { useState } from "react";
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
import { ToastAction } from "@/components/ui/toast";
import { Loader } from "@/components/ui/loader";
import { useToast } from "@/components/ui/use-toast";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Trash } from "lucide-react";
import type { deleteExerciseAction } from "@/serverActions/exercises";
import type { Exercise } from "@/db/schema";

type Props = {
  onAction: typeof deleteExerciseAction;
  exercise: Exercise;
};

export const DeleteExerciseAlertDialog = ({ onAction, exercise }: Props) => {
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const [isDeleteExerciseLoading, setIsDeleteExerciseLoading] = useState(false);
  const { toast } = useToast();

  const deleteHandler = async () => {
    try {
      setIsDeleteExerciseLoading(() => true);
      await onAction({ exerciseId: exercise.id });
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
      <AlertDialogTrigger asChild>
        <DropdownMenuItem
          className="text-destructive/80 focus:bg-destructive/20 focus:text-destructive"
          onSelect={(e) => e.preventDefault()}
        >
          <Trash className="mr-2 h-4 w-4" />
          <span className="capitalize">delete exercise</span>
        </DropdownMenuItem>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete{" "}
            <strong>{exercise.name}</strong> from your exercise list
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
