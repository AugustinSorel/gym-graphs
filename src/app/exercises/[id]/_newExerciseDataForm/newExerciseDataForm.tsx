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
import { api } from "@/trpc/react";
import { useExercisePageParams } from "../_components/useExercisePageParams";
import type { ExerciseData } from "@/db/types";
import { dateAsYearMonthDayFormat } from "@/lib/date";

export const NewExerciseDataForm = () => {
  const [numberOfRepetitions, setNumberofRepetitions] = useState("");
  const [weightLifted, setWeightLifted] = useState("");
  const { toast } = useToast();
  const weightUnit = useWeightUnit();
  const utils = api.useUtils();
  const params = useExercisePageParams();

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
    onMutate: (variables) => {
      const cachedExercises = utils.exercise.all.getData();
      const cachedExercise = utils.exercise.get.getData({
        id: params.id,
      });

      if (!cachedExercise) {
        return;
      }

      const alreadyEnteredData = cachedExercise.data.find(
        (exerciseData) =>
          exerciseData.doneAt === dateAsYearMonthDayFormat(new Date()),
      );

      if (alreadyEnteredData) {
        throw new Error("you have already entered today's data");
      }

      const optimisticExerciseData: ExerciseData = {
        id: Math.random().toString(),
        createdAt: new Date(),
        doneAt: new Date().toString(),
        updatedAt: new Date(),
        exerciseId: params.id,
        numberOfRepetitions: variables.numberOfRepetitions,
        weightLifted: variables.weightLifted,
      };

      utils.exercise.get.setData(
        { id: params.id },
        {
          ...cachedExercise,
          data: [...cachedExercise.data, optimisticExerciseData],
        },
      );

      if (!cachedExercises) {
        return;
      }

      utils.exercise.all.setData(
        undefined,
        cachedExercises.map((exercise) => {
          if (exercise.id === params.id) {
            return {
              ...exercise,
              data: [...exercise.data, optimisticExerciseData],
            };
          }

          return exercise;
        }),
      );
    },
    onSettled: async () => {
      await utils.exercise.get.invalidate({ id: params.id });
      await utils.exercise.all.invalidate();
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
          exerciseId: params.id,
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
