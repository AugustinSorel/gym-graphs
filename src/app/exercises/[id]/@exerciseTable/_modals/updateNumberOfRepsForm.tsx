"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader } from "@/components/ui/loader";
import { Edit2 } from "lucide-react";
import { useState } from "react";
import { experimental_useFormStatus as useFormStatus } from "react-dom";
import { useToast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { updateNumberOfRepsSchema } from "@/schemas/exerciseSchemas";
import type { updateNumberOfRepsAction } from "@/serverActions/exerciseData";
import type { ExerciseData } from "@/db/types";

type Props = {
  onAction: typeof updateNumberOfRepsAction;
  exerciseData: ExerciseData;
};

export const UpdateNumberOfRepsForm = ({ onAction, exerciseData }: Props) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [updatedNumberOfReps, setUpdatedNumberOfReps] = useState(
    exerciseData.numberOfRepetitions.toString()
  );
  const { toast } = useToast();

  const actionHandler = async (e: FormData) => {
    const data = updateNumberOfRepsSchema.safeParse({
      numberOfReps: +updatedNumberOfReps,
      exerciseDataId: exerciseData.id,
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
      await onAction(data.data);
      setUpdatedNumberOfReps(data.data.numberOfReps.toString());
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
          <span className="capitalize">change number of reps</span>
        </DropdownMenuItem>
      </DialogTrigger>

      <DialogContent className="space-y-5 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="capitalize">
            change number of repetitions
          </DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-2"
          action={(e) => void actionHandler(e)}
        >
          <Label htmlFor="name" className="capitalize">
            number of reps
          </Label>
          <Input
            id="name"
            value={updatedNumberOfReps}
            onChange={(e) => setUpdatedNumberOfReps(e.target.value)}
            autoComplete="off"
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
