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
import { Edit2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";
import type { ExerciseData } from "@/db/types";
import { api } from "@/trpc/react";

type Props = {
  exerciseData: ExerciseData;
};

export const UpdateNumberOfRepsForm = ({ exerciseData }: Props) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [updatedNumberOfReps, setUpdatedNumberOfReps] = useState(
    exerciseData.numberOfRepetitions.toString(),
  );
  const { toast } = useToast();
  const utils = api.useUtils();

  const updateNumberOfReps = api.exerciseData.updateNumberOfReps.useMutation({
    onError: (error, variables) => {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: error.message,
        action: (
          <ToastAction
            altText="Try again"
            onClick={() => updateNumberOfReps.mutate(variables)}
          >
            Try again
          </ToastAction>
        ),
      });
    },
    onMutate: (variables) => {
      const cachedExercises = utils.exercise.all.getData();
      const cachedExercise = utils.exercise.get.getData({
        id: exerciseData.exerciseId,
      });

      if (!cachedExercise) {
        return;
      }

      const optimisticExerciseData = {
        ...exerciseData,
        numberOfRepetitions: variables.numberOfRepetitions,
      };

      utils.exercise.get.setData(
        { id: exerciseData.exerciseId },
        {
          ...cachedExercise,
          data: cachedExercise.data.map((exerciseData) => {
            if (exerciseData.id === variables.id) {
              return optimisticExerciseData;
            }

            return exerciseData;
          }),
        },
      );

      if (!cachedExercises) {
        return;
      }

      utils.exercise.all.setData(
        undefined,
        cachedExercises.map((exercise) => {
          if (exercise.id === exerciseData.exerciseId) {
            return {
              ...exercise,
              data: exercise.data.map((exerciseData) => {
                if (exerciseData.id === variables.id) {
                  return optimisticExerciseData;
                }

                return exerciseData;
              }),
            };
          }

          return exercise;
        }),
      );

      setIsDialogOpen(() => false);
    },
    onSettled: async () => {
      await utils.exercise.get.invalidate({ id: exerciseData.exerciseId });
      await utils.exercise.all.invalidate();
    },
  });

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
          onSubmit={(e) => {
            e.preventDefault();
            updateNumberOfReps.mutate({
              id: exerciseData.id,
              numberOfRepetitions: +updatedNumberOfReps,
            });
          }}
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

          <Button className="ml-auto space-x-2">
            <span className="capitalize">save change</span>
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
