import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import {
  Form,
  FormAlert,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/ui/form";
import { Spinner } from "~/ui/spinner";
import { z } from "zod";
import { Input } from "~/ui/input";
import { Button } from "~/ui/button";
import { createSetAction } from "~/set/set.actions";
import { setSchema } from "~/set/set.schemas";
import { useExercise } from "~/exercise/hooks/use-exercise";
import { dateAsYYYYMMDD, getCalendarPositions } from "~/utils/date";
import { exerciseKeys } from "~/exercise/exercise.keys";
import { useUser } from "~/user/hooks/use-user";
import { getRouteApi } from "@tanstack/react-router";
import { dashboardKeys } from "~/dashboard/dashboard.keys";
import { setKeys } from "~/set/set.keys";

export const AddSetForm = (props: Props) => {
  const form = useCreateExerciseSetForm();
  const createSet = useCreateSet();
  const params = routeApi.useParams();
  const exericse = useExercise({ id: params.exerciseId });

  const onSubmit = async (data: CreateExerciseSchema) => {
    await createSet.mutateAsync(
      {
        data: {
          exerciseId: exericse.data.id,
          repetitions: data.repetitions,
          weightInKg: data.weightInKg,
        },
      },
      {
        onSuccess: () => {
          if (props.onSuccess) {
            props.onSuccess();
          }
        },
        onError: (error) => {
          form.setError("root", { message: error.message });
        },
      },
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="weightInKg"
          render={({ field }) => (
            <FormItem>
              <FormLabel>weight:</FormLabel>
              <FormControl>
                <Input type="number" placeholder="75" autoFocus {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="repetitions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>repetitions:</FormLabel>
              <FormControl>
                <Input type="number" placeholder="10" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormAlert />

        <footer className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            data-umami-event="exercise set created"
            className="font-semibold"
          >
            <span>add</span>
            {form.formState.isSubmitting && <Spinner />}
          </Button>
        </footer>
      </form>
    </Form>
  );
};

type Props = Readonly<{
  onSuccess?: () => void;
}>;

const routeApi = getRouteApi("/exercises/$exerciseId");

const useFormSchema = () => {
  const params = routeApi.useParams();
  const exericse = useExercise({ id: params.exerciseId });

  return z
    .object({
      repetitions: z.coerce.number(),
      weightInKg: z.coerce.number(),
    })
    .pipe(setSchema.pick({ repetitions: true, weightInKg: true }))
    .refine(
      () => {
        const setAlreadyExists = exericse.data.sets.find(
          (set) => dateAsYYYYMMDD(set.doneAt) === dateAsYYYYMMDD(new Date()),
        );

        return !setAlreadyExists;
      },
      {
        message: "set already created for today",
        path: ["repetitions"],
      },
    );
};

type CreateExerciseSchema = Readonly<z.infer<ReturnType<typeof useFormSchema>>>;

const useCreateExerciseSetForm = () => {
  const formSchema = useFormSchema();

  return useForm<CreateExerciseSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      repetitions: 0,
      weightInKg: 0,
    },
  });
};

const useCreateSet = () => {
  const user = useUser();
  const params = routeApi.useParams();
  const exercise = useExercise({ id: params.exerciseId });
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSetAction,
    onMutate: (variables) => {
      const keys = {
        exercise: exerciseKeys.get(user.data.id, exercise.data.id).queryKey,
        tiles: dashboardKeys.tiles(user.data.id).queryKey,
        setsHeatMap: setKeys.heatMap(user.data.id).queryKey,
        exercisesFrequency: exerciseKeys.exercisesFrequency(user.data.id)
          .queryKey,
      } as const;

      const optimisticExerciseSet = {
        id: Math.random(),
        exerciseId: variables.data.exerciseId,
        weightInKg: variables.data.weightInKg,
        repetitions: variables.data.repetitions,
        createdAt: new Date(),
        doneAt: new Date(),
        updatedAt: new Date(),
      };

      queryClient.setQueryData(keys.tiles, (tiles) => {
        if (!tiles) {
          return tiles;
        }

        return {
          ...tiles,
          pages: tiles.pages.map((page) => {
            return {
              ...page,
              tiles: page.tiles.map((tile) => {
                if (tile.exercise?.id === variables.data.exerciseId) {
                  return {
                    ...tile,
                    exercise: {
                      ...tile.exercise,
                      sets: [optimisticExerciseSet, ...tile.exercise.sets],
                    },
                  };
                }

                return tile;
              }),
            };
          }),
        };
      });

      queryClient.setQueryData(keys.exercisesFrequency, (data) => {
        if (!data) {
          return data;
        }

        return data.map((exercise) => {
          if (exercise.id === variables.data.exerciseId) {
            return {
              ...exercise,
              frequency: exercise.frequency + 1,
            };
          }

          return exercise;
        });
      });

      queryClient.setQueryData(keys.setsHeatMap, (data) => {
        if (!data) {
          return data;
        }

        const calendarPositions = getCalendarPositions(
          optimisticExerciseSet.doneAt,
        );

        return data.map((row) => {
          if (row.dayIndex === calendarPositions.day) {
            return {
              ...row,
              bins: row.bins.map((cell) => {
                if (cell.weekIndex === calendarPositions.week) {
                  return {
                    ...cell,
                    count: cell.count + 1,
                  };
                }
                return cell;
              }),
            };
          }

          return row;
        });
      });

      queryClient.setQueryData(keys.exercise, (exercise) => {
        if (!exercise) {
          return exercise;
        }

        return {
          ...exercise,
          sets: [optimisticExerciseSet, ...exercise.sets],
        };
      });
    },
    onSettled: () => {
      const keys = {
        exercise: exerciseKeys.get(user.data.id, exercise.data.id),
        tiles: dashboardKeys.tiles(user.data.id),
        exercisesFrequency: exerciseKeys.exercisesFrequency(user.data.id),
        setsHeatMap: setKeys.heatMap(user.data.id),
      } as const;

      void queryClient.invalidateQueries(keys.tiles);
      void queryClient.invalidateQueries(keys.exercise);
      void queryClient.invalidateQueries(keys.exercisesFrequency);
      void queryClient.invalidateQueries(keys.setsHeatMap);
    },
  });
};
