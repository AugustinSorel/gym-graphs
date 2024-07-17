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
import { Edit2 } from "lucide-react";
import { useState } from "react";
import type { ExerciseData } from "@/server/db/types";
import { api } from "@/trpc/react";
import { Loader } from "@/components/ui/loader";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { exerciseDataSchema } from "@/schemas/exerciseData.schemas";

const formSchema = z
  .object({ numberOfRepetitions: z.coerce.number() })
  .pipe(exerciseDataSchema.pick({ numberOfRepetitions: true }));

type Props = {
  exerciseData: ExerciseData;
};

export const UpdateNumberOfRepsForm = ({ exerciseData }: Props) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const utils = api.useUtils();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      numberOfRepetitions: exerciseData.numberOfRepetitions,
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    updateNumberOfReps.mutate({
      id: exerciseData.id,
      numberOfRepetitions: values.numberOfRepetitions,
    });
  };

  const updateNumberOfReps = api.exerciseData.updateNumberOfReps.useMutation({
    onSuccess: () => {
      setIsDialogOpen(() => false);
    },
    onMutate: async (variables) => {
      await utils.exercise.all.cancel();
      await utils.exercise.get.cancel({ id: exerciseData.exerciseId });
      await utils.user.get.cancel();

      const optimisticExerciseData = {
        ...exerciseData,
        numberOfRepetitions: variables.numberOfRepetitions,
      };

      utils.exercise.get.setData(
        { id: exerciseData.exerciseId },
        (exercise) => {
          if (!exercise) {
            return undefined;
          }

          return {
            ...exercise,
            data: exercise.data.map((exerciseData) => {
              if (exerciseData.id === variables.id) {
                return optimisticExerciseData;
              }

              return exerciseData;
            }),
          };
        },
      );

      utils.exercise.all.setData(undefined, (exercises) =>
        exercises?.map((exercise) => {
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
    onSettled: () => {
      void utils.exercise.get.invalidate({ id: exerciseData.exerciseId });
      void utils.exercise.all.invalidate();
      void utils.user.get.invalidate();
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

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-2"
          >
            <FormField
              control={form.control}
              name="numberOfRepetitions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>number of reps</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="10"
                      type="number"
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              className="ml-auto space-x-2"
              disabled={updateNumberOfReps.isPending}
            >
              {updateNumberOfReps.isPending && <Loader />}
              <span className="capitalize">change</span>
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
