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
import { useState } from "react";
import { api } from "@/trpc/react";

export const NewExerciseForm = () => {
  const [name, setName] = useState("");
  const { toast } = useToast();
  const utils = api.useUtils();

  const createExercise = api.exercise.create.useMutation({
    onSuccess: () => {
      setName("");
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: error.message,
        action: (
          <ToastAction
            altText="Try again"
            onClick={() => void createExercise.mutate({ name })}
          >
            Try again
          </ToastAction>
        ),
      });
    },
    onSettled: async () => {
      await utils.exercise.all.invalidate();
    },
  });

  return (
    <form
      action={() => createExercise.mutate({ name })}
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
            <Button
              size="icon"
              aria-label="add"
              disabled={createExercise.isPending}
            >
              {createExercise.isPending ? (
                <Loader className="h-4 w-4" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="capitalize">add</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </form>
  );
};
