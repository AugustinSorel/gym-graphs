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
import { useWeightUnit } from "@/context/weightUnit";
import { convertWeightToKg } from "@/lib/math";
import { api } from "@/trpc/react";
import { useExercisePageParams } from "../_components/useExercisePageParams";
import { dateAsYearMonthDayFormat } from "@/lib/date";
import type { ExerciseData } from "@/server/db/types";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";

export const NewExerciseDataForm = () => {
  const weightUnit = useWeightUnit();
  const utils = api.useUtils();
  const params = useExercisePageParams();
  const formSchema = useFormSchema();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      numberOfRepetitions: 0,
      weightLifted: 0,
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    addExerciseData.mutate({
      numberOfRepetitions: values.numberOfRepetitions,
      weightLifted: convertWeightToKg(values.weightLifted, weightUnit.get),
      exerciseId: params.id,
    });
  };

  const addExerciseData = api.exerciseData.create.useMutation({
    onSuccess: () => {
      form.reset();
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
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mx-auto flex max-w-2xl gap-2"
      >
        <FormField
          control={form.control}
          name="numberOfRepetitions"
          render={({ field }) => (
            <FormItem>
              <Input
                placeholder="№ of reps..."
                autoComplete="off"
                type="number"
                {...field}
                value={field.value || ""}
              />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="weightLifted"
          render={({ field }) => (
            <FormItem>
              <Input
                placeholder={`Weight - (${weightUnit.get})`}
                autoComplete="off"
                type="number"
                {...field}
                value={field.value || ""}
              />
              <FormMessage />
            </FormItem>
          )}
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
    </Form>
  );
};

const useFormSchema = () => {
  const weightUnit = useWeightUnit();
  const utils = api.useUtils();

  const formSchema = z
    .object({
      numberOfRepetitions: z.coerce
        .number({
          required_error: "number of repetitions is required",
          invalid_type_error: "number of repetitions must be a number",
        })
        .min(1, "number of repetitions must be at least 1")
        .max(200, "number of repetitions must at most 200")
        .int({
          message: "number of repetitions must be an integer",
        }),
      weightLifted: z.coerce
        .number({
          required_error: "weight lifted is required",
          invalid_type_error: "weight lifted must be a number",
        })
        .min(1, `weight lifted must be at least 1${weightUnit.get}`)
        .max(1000, `weight lifted must be at most 1000${weightUnit.get}`),
    })
    .refine(
      () => {
        const exerciseCached = utils.exercise.get.getData({ id: "" });
        const todaysDate = dateAsYearMonthDayFormat(new Date());

        return exerciseCached?.data.find((e) => e.doneAt === todaysDate);
      },
      {
        message: "you have already entered today's data",
        path: ["numberOfRepetitions"],
      },
    );

  return formSchema;
};
