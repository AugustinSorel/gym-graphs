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
import type { addNewExerciseAction } from "@/serverActions/exercises";
import { useSession } from "next-auth/react";

type Props = { action: typeof addNewExerciseAction };

export const NewExerciseForm = ({ action }: Props) => {
  const [name, setName] = useState("");
  const { toast } = useToast();
  const { data: session } = useSession();

  const actionHandler = async (e: FormData) => {
    const newExercise = newExerciseNameSchema.safeParse({
      name,
      userId: session?.user.id,
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
      const res = await action(newExercise.data);

      if ("error" in res && res.error === "duplicate") {
        throw new Error("exercise name is already used");
      }

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
