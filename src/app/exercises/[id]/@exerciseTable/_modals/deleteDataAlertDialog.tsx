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
import { Loader } from "@/components/ui/loader";
import { useToast } from "@/components/ui/use-toast";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Trash } from "lucide-react";
import type { deleteDataAction } from "@/serverActions/exerciseData";
import { ToastAction } from "@/components/ui/toast";
import type { ExerciseData } from "@/db/types";
import { deleteExerciseDataSchema } from "@/schemas/exerciseSchemas";
import { getErrorMessage } from "@/lib/utils";

type Props = {
  onAction: typeof deleteDataAction;
  exerciseDataId: ExerciseData["id"];
};

export const DeleteDataAlertDialog = ({ onAction, exerciseDataId }: Props) => {
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const deleteHandler = async () => {
    try {
      const data = deleteExerciseDataSchema.parse({ exerciseDataId });

      setIsLoading(() => true);

      const res = await onAction(data);

      if (res.serverError) {
        throw new Error(res.serverError);
      }

      setIsAlertDialogOpen(() => false);
    } catch (error) {
      return toast({
        variant: "destructive",
        title: "Something went wrong",
        description: getErrorMessage(error),
        action: (
          <ToastAction altText="Try again" onClick={() => void deleteHandler()}>
            Try again
          </ToastAction>
        ),
      });
    } finally {
      setIsLoading(() => false);
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
          <span className="capitalize">delete data</span>
        </DropdownMenuItem>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the data
            from your exercise
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
            {isLoading && <Loader />}
            <span className="capitalize">delete</span>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
