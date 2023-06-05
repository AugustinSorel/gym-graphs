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
import { toast } from "@/components/ui/use-toast";
import { newExerciseNameSchema } from "@/schemas/exerciseSchemas";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { experimental_useFormStatus as useFormStatus } from "react-dom";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Edit2 } from "lucide-react";

type Props = {
  onAction: (formData: FormData) => Promise<void>;
};

//FIXME: remove warning
export const UpdateExerciseNameDialog = ({ onAction }: Props) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [updatedExerciseName, setUpdatedExerciseName] = useState("bench press");

  const actionHandler = async (e: FormData) => {
    const data = newExerciseNameSchema.safeParse({ name: updatedExerciseName });

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
      await onAction(e);
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
