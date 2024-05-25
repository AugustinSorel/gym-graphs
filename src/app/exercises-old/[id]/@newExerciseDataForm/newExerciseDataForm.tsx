"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { useWeightUnit } from "@/context/weightUnit";
import { convertWeightToKg } from "@/lib/math";
import { usePathname } from "next/navigation";
import { api } from "@/trpc/react";

export const NewExerciseDataForm = () => {
  const [numberOfRepetitions, setNumberofRepetitions] = useState("");
  const [weightLifted, setWeightLifted] = useState("");
  const { toast } = useToast();
  const weightUnit = useWeightUnit();
  const pathname = usePathname().split("/");

  //TODO: performance
  const addExerciseData = api.exerciseData.create.useMutation({
    onSuccess: () => {
      setNumberofRepetitions("");
      setWeightLifted("");
    },
    onError: (error, variables) => {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: error.message,
        action: (
          <ToastAction
            altText="Try again"
            onClick={() => addExerciseData.mutate(variables)}
          >
            Try again
          </ToastAction>
        ),
      });
    },
  });

  return (
    <form
      className="mx-auto flex max-w-2xl gap-2"
      onSubmit={(e) => {
        e.preventDefault();

        addExerciseData.mutate({
          numberOfRepetitions: +numberOfRepetitions,
          weightLifted: convertWeightToKg(+weightLifted, weightUnit.get),
          exerciseId: pathname[2] ?? "",
        });
      }}
    >
      <Input
        placeholder="№ of reps..."
        value={numberOfRepetitions}
        onChange={(e) => setNumberofRepetitions(e.target.value)}
        name="numberOfRepetitions"
        autoComplete="off"
      />
      <Input
        placeholder={`Weight - (${weightUnit.get})`}
        value={weightLifted}
        onChange={(e) => setWeightLifted(e.target.value)}
        name="weightLifted"
        autoComplete="off"
      />
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              aria-label="add"
              disabled={addExerciseData.isPending}
            >
              {addExerciseData.isPending ? (
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
