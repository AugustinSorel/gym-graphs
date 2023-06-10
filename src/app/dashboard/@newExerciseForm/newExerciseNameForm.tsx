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
import { experimental_useFormStatus as useFormStatus } from "react-dom";
import { Loader } from "@/components/ui/loader";
import { newExerciseNameSchema } from "@/schemas/exerciseSchemas";
import { useState } from "react";
import type { addNewExerciseAction } from "./actions";

type Props = { action: typeof addNewExerciseAction };

//FIXME: remove warning
export const NewExerciseForm = ({ action }: Props) => {
  const [name, setName] = useState("");
  const { toast } = useToast();

  const actionHandler = async (e: FormData) => {
    const newExercise = newExerciseNameSchema.safeParse({
      name,
    });

    if (!newExercise.success) {
      return toast({
        variant: "destructive",
        title: "Something went wrong",
        description: newExercise.error.issues[0]?.message,
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
      await action(newExercise.data);
      setName("");
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
    <form
      action={(e) => void actionHandler(e)}
      className="mx-auto flex max-w-2xl gap-2"
    >
      <Input
        name="newExerciseName"
        placeholder="new exercise name"
        value={name}
        onChange={(e) => setName(e.target.value)}
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