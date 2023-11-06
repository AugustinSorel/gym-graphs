"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import { updateExerciseNameSchema } from "@/schemas/exerciseSchemas";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { experimental_useFormStatus as useFormStatus } from "react-dom";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Edit2 } from "lucide-react";
import { updateExerciseNameAction } from "@/serverActions/exercises";
import type { Exercise } from "@/db/types";
import { getErrorMessage } from "@/lib/utils";

type Props = {
  exercise: Exercise;
};

export const UpdateExerciseNameDialog = ({ exercise }: Props) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [updatedExerciseName, setUpdatedExerciseName] = useState(exercise.name);
  const { toast } = useToast();

  const actionHandler = async (e: FormData) => {
    try {
      const data = updateExerciseNameSchema.parse({
        exerciseId: exercise.id,
        name: updatedExerciseName,
      });

      const res = await updateExerciseNameAction(data);

      if (res.serverError) {
        throw new Error(res.serverError);
      }

      setIsDialogOpen(() => false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: getErrorMessage(error),
        action: (
          <ToastAction
            altText="Try again"
            onClick={() => void actionHandler(e)}
          >
            Try again
          </ToastAction>
        ),
      });
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <Edit2 className="mr-2 h-4 w-4" />
          <span className="capitalize">rename</span>
        </DropdownMenuItem>
      </DialogTrigger>

      <DialogContent className="space-y-5 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="capitalize">change exercise name</DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-2"
          action={(e) => void actionHandler(e)}
        >
          <Label htmlFor="name" className="capitalize">
            exercise name
          </Label>
          <Input
            id="name"
            value={updatedExerciseName}
            onChange={(e) => setUpdatedExerciseName(e.target.value)}
          />

          <SubmitButton />
        </form>
      </DialogContent>
    </Dialog>
  );
};

const SubmitButton = () => {
  const formStatus = useFormStatus();
  return (
    <Button className="ml-auto space-x-2" disabled={formStatus.pending}>
      {formStatus.pending && <Loader />}
      <span className="capitalize">save change</span>
    </Button>
  );
};
