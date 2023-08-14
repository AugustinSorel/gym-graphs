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
import type { updateExerciseNameAction } from "@/serverActions/exercises";
import type { Exercise } from "@/db/schema";

type Props = {
  onAction: typeof updateExerciseNameAction;
  exercise: Exercise;
};

export const UpdateExerciseNameDialog = ({ onAction, exercise }: Props) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [updatedExerciseName, setUpdatedExerciseName] = useState(exercise.name);
  const { toast } = useToast();

  const actionHandler = async (e: FormData) => {
    const data = updateExerciseNameSchema.safeParse({
      exerciseId: exercise.id,
      name: updatedExerciseName,
    });

    if (!data.success) {
      return toast({
        variant: "destructive",
        title: "Something went wrong",
        description: data.error.issues[0]?.message,
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

    try {
      const res = await onAction(data.data);

      if ("error" in res && res.error === "duplicate") {
        throw new Error("exercise name is already used");
      }

      setUpdatedExerciseName("");
      setIsDialogOpen(() => false);
    } catch (error) {
      return toast({
        variant: "destructive",
        title: "Something went wrong",
        description: error instanceof Error ? error.message : "try again",
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
