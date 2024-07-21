"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Plus } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { api } from "@/trpc/react";
import { exerciseSchema } from "@/schemas/exercise.schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

export const NewExerciseForm = () => {
  const utils = api.useUtils();
  const formSchema = useFormSchema();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "" },
  });

  const createExercise = api.exercise.create.useMutation({
    onMutate: async () => {
      await utils.exercise.all.cancel();
      await utils.user.get.cancel();
    },
    onSettled: async () => {
      await utils.exercise.all.invalidate();
      await utils.user.get.invalidate();

      form.reset();
    },
  });

  const onSubmit = (newExercise: z.infer<typeof formSchema>) => {
    createExercise.mutate(newExercise);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mx-auto grid w-full max-w-2xl grid-cols-[1fr_auto] gap-2"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder="new exercise name" {...field} />
              </FormControl>
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
    </Form>
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
