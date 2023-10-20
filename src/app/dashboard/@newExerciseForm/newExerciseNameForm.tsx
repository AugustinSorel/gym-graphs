"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToastAction } from "@/components/ui/toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import { Plus } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { newExerciseNameSchema } from "@/schemas/exerciseSchemas";
import { useState } from "react";
import type { addNewExerciseAction } from "@/serverActions/exercises";
import { getErrorMessage } from "@/lib/utils";
import { useFormStatus } from "react-dom";

type Props = { action: typeof addNewExerciseAction };

export const NewExerciseForm = ({ action }: Props) => {
  const [name, setName] = useState("");
  const { toast } = useToast();

  const actionHandler = async (e: FormData) => {
    try {
      const newExercise = newExerciseNameSchema.parse({ name });
      const res = await action(newExercise);

      if (res.serverError) {
        throw new Error(res.serverError);
      }

      setName("");
    } catch (error) {
      return toast({
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
    <form
      action={(e) => void actionHandler(e)}
      className="mx-auto flex w-full max-w-2xl gap-2"
    >
      <Input
        name="newExerciseName"
        placeholder="new exercise name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoComplete="off"
      />

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <SubmitButton />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="capitalize">add</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </form>
  );
};

const SubmitButton = () => {
  const formStatus = useFormStatus();
  return (
    <Button size="icon" aria-label="add" disabled={formStatus.pending}>
      {formStatus.pending ? (
        <Loader className="h-4 w-4" />
      ) : (
        <Plus className="h-4 w-4" />
      )}
    </Button>
  );
};
