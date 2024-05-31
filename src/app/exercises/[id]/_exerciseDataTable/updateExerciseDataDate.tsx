import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { CalendarIcon, Edit2 } from "lucide-react";
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { dateAsYearMonthDayFormat, formatDate } from "@/lib/date";
import type { ExerciseData } from "@/server/db/types";
import { api } from "@/trpc/react";
import { exerciseDataSchema } from "@/schemas/exerciseData.schemas";
import { Loader } from "@/components/ui/loader";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

type Props = {
  exerciseData: ExerciseData;
};

export const UpdateExerciseDataDate = ({ exerciseData }: Props) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const utils = api.useUtils();

  const formSchema = useFormSchema(exerciseData);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(exerciseData.doneAt),
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    updateDoneAt.mutate({
      id: exerciseData.id,
      doneAt: dateAsYearMonthDayFormat(values.date),
    });
  };

  const updateDoneAt = api.exerciseData.updateDoneAt.useMutation({
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
        doneAt: variables.doneAt,
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
    onSettled: () => {
      void utils.exercise.get.invalidate({ id: exerciseData.exerciseId });
      void utils.exercise.all.invalidate();
    },
  });

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <Edit2 className="mr-2 h-4 w-4" />
          <span className="capitalize">change date</span>
        </DropdownMenuItem>
      </DialogTrigger>

      <DialogContent className="space-y-5 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="capitalize">change exercise date</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-2"
          >
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          {field.value ? (
                            formatDate(field.value)
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent>
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            !exerciseDataSchema
                              .pick({ doneAt: true })
                              .safeParse({
                                doneAt: dateAsYearMonthDayFormat(date),
                              }).success
                          }
                          initialFocus
                          autofocus
                          {...field}
                        />
                      </PopoverContent>
                    </Popover>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              className="ml-auto space-x-2"
              disabled={updateDoneAt.isPending}
            >
              {updateDoneAt.isPending && <Loader />}
              <span className="capitalize">save</span>
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

const useFormSchema = (exerciseData: ExerciseData) => {
  const utils = api.useUtils();

  const formSchema = z
    .object({
      date: z.date(),
    })
    .refine(
      (data) => {
        const exerciseCached = utils.exercise.get.getData({
          id: exerciseData.exerciseId,
        });

        return !exerciseCached?.data.find(
          (e) =>
            e.doneAt === dateAsYearMonthDayFormat(data.date) &&
            e.id !== exerciseData.id,
        );
      },
      {
        message: "you have already entered today's data",
        path: ["date"],
      },
    );

  return formSchema;
};
