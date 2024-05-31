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
import { Loader } from "@/components/ui/loader";
import { Edit2 } from "lucide-react";
import { useState } from "react";
import type { ExerciseData } from "@/server/db/types";
import { convertWeightToKg } from "@/lib/math";
import { useWeightUnit } from "@/context/weightUnit";
import { api } from "@/trpc/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const formSchema = z.object({
  weightLifted: z.coerce
    .number({
      required_error: "weight lifted is required",
      invalid_type_error: "weight lifted must be a number",
    })
    .min(1, "weight lifted must be at least 1kg")
    .max(1000, "weight lifted must be at most 1000 kg"),
});

type Props = {
  exerciseData: ExerciseData;
};

export const UpdateWeightLifted = ({ exerciseData }: Props) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const weightUnit = useWeightUnit();
  const utils = api.useUtils();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      weightLifted: exerciseData.weightLifted,
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    updateWeightLifted.mutate({
      id: exerciseData.id,
      weightLifted: convertWeightToKg(values.weightLifted, weightUnit.get),
    });
  };

  const updateWeightLifted = api.exerciseData.updateWeightLifted.useMutation({
    onSuccess: () => {
      setIsDialogOpen(() => false);
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
        weightLifted: variables.weightLifted,
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
          <span className="capitalize">change weight lifted</span>
        </DropdownMenuItem>
      </DialogTrigger>

      <DialogContent className="space-y-5 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="capitalize">change weight lifted</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-2"
          >
            <FormField
              control={form.control}
              name="weightLifted"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>weight lifted</FormLabel>
                  <FormControl>
                    <Input
                      autoComplete="off"
                      placeholder="10"
                      type="number"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              className="ml-auto space-x-2"
              disabled={updateWeightLifted.isPending}
            >
              {updateWeightLifted.isPending && <Loader className="mr-2" />}
              <span className="capitalize">save</span>
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
