"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Edit2 } from "lucide-react";
import { api } from "@/trpc/react";
import { Loader } from "@/components/ui/loader";
import type { Exercise } from "@/server/db/types";
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
import { exerciseSchema } from "@/schemas/exercise.schema";
import type { z } from "zod";

type Props = {
  exercise: Exercise;
};

export const UpdateExerciseNameDialog = ({ exercise }: Props) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const utils = api.useUtils();
  const formSchema = useFormSchema();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: exercise.name },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    updateExerciseName.mutate({
      id: exercise.id,
      name: values.name,
    });
  };

  const updateExerciseName = api.exercise.update.useMutation({
    onSuccess: () => {
      setIsDialogOpen(false);
    },
    onMutate: (exerciseToUpdate) => {
      const allExercises = utils.exercise.all.getData();
      const exerciseCached = utils.exercise.get.getData({ id: exercise.id });

      if (!allExercises) {
        return;
      }

      utils.exercise.all.setData(
        undefined,
        allExercises.map((exercise) =>
          exercise.id === exerciseToUpdate.id
            ? { ...exercise, name: exerciseToUpdate.name }
            : exercise,
        ),
      );

      if (!exerciseCached) {
        return;
      }

      utils.exercise.get.setData(
        { id: exercise.id },
        { ...exerciseCached, name: exerciseToUpdate.name },
      );
    },

    onSettled: () => {
      void utils.exercise.all.invalidate();
      void utils.exercise.get.invalidate({ id: exercise.id });
    },
  });

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <Edit2 className="mr-2 h-4 w-4" />
          <span className="capitalize">rename</span>
        </DropdownMenuItem>
      </DialogTrigger>

      <DialogContent className="space-y-5 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="capitalize">change exercise name</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>exercise name</FormLabel>
                  <FormControl>
                    <Input placeholder="exercise name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={updateExerciseName.isPending}
              className="ml-auto"
            >
              {updateExerciseName.isPending && <Loader className="mr-2" />}
              <span className="capitalize">save</span>
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

const useFormSchema = () => {
  const utils = api.useUtils();

  const formSchema = exerciseSchema
    .pick({
      name: true,
    })
    .refine(
      (data) => {
        const exercises = utils.exercise.all.getData();

        return !exercises?.find(
          (exercise) => exercise.name.toLowerCase() === data.name.toLowerCase(),
        );
      },
      (data) => {
        return {
          message: `${data.name} is already used`,
          path: ["name"],
        };
      },
    );

  return formSchema;
};
