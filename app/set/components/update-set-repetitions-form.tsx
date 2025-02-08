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
import { exerciseQueries } from "~/exercise/exercise.queries";
import { Input } from "~/ui/input";
import { Button } from "~/ui/button";
import { useExercise } from "~/exercise/hooks/use-exercise";
import { updateSetRepetitionsAction } from "~/set/set.actions";
import { setSchema } from "~/set/set.schemas";
import { useSet } from "~/set/set.context";
import { getRouteApi } from "@tanstack/react-router";
import { dashboardQueries } from "~/dashboard/dashboard.queries";

export const UpdateSetRepetitionsForm = (props: Props) => {
  const form = useCreateExerciseForm();
  const updateSetRepetitions = useUpdateSetRepetitions();
  const set = useSet();

  const onSubmit = async (data: CreateExerciseSchema) => {
    await updateSetRepetitions.mutateAsync(
      {
        data: {
          setId: set.id,
          repetitions: data.repetitions,
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
          name="repetitions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>weight:</FormLabel>
              <FormControl>
                <Input type="number" placeholder="10" autoFocus {...field} />
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
            data-umami-event="update exercise set repetitions"
            className="font-semibold"
          >
            <span>update</span>
            {form.formState.isSubmitting && <Spinner />}
          </Button>
        </footer>
      </form>
    </Form>
  );
};

const routeApi = getRouteApi("/exercises/$exerciseId");

type Props = Readonly<{
  onSuccess?: () => void;
}>;

const useFormSchema = () => {
  return z
    .object({ repetitions: z.coerce.number() })
    .pipe(setSchema.pick({ repetitions: true }));
};

type CreateExerciseSchema = Readonly<z.infer<ReturnType<typeof useFormSchema>>>;

const useCreateExerciseForm = () => {
  const formSchema = useFormSchema();
  const set = useSet();

  return useForm<CreateExerciseSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      repetitions: set.repetitions,
    },
  });
};

const useUpdateSetRepetitions = () => {
  const queryClient = useQueryClient();
  const params = routeApi.useParams();
  const exercise = useExercise({ id: params.exerciseId });
  const set = useSet();

  return useMutation({
    mutationFn: updateSetRepetitionsAction,
    onMutate: (variables) => {
      const queries = {
        tiles: dashboardQueries.tiles.queryKey,
        exericse: exerciseQueries.get(exercise.data.id).queryKey,
        funFacts: dashboardQueries.funFacts.queryKey,
      } as const;

      queryClient.setQueryData(queries.tiles, (tiles) => {
        if (!tiles) {
          return tiles;
        }

        return {
          ...tiles,
          pages: tiles.pages.map((page) => {
            return {
              ...page,
              tiles: page.tiles.map((tile) => {
                if (tile.exercise?.id === exercise.data.id) {
                  return {
                    ...tile,
                    exercise: {
                      ...tile.exercise,
                      sets: tile.exercise.sets.map((set) => {
                        if (set.id === variables.data.setId) {
                          return {
                            ...set,
                            repetitions: variables.data.repetitions,
                          };
                        }

                        return set;
                      }),
                    },
                  };
                }

                return tile;
              }),
            };
          }),
        };
      });

      queryClient.setQueryData(queries.funFacts, (funFacts) => {
        if (!funFacts) {
          return funFacts;
        }

        const totalWeightInKg = {
          current: set.weightInKg * set.repetitions,
          optimistic: variables.data.repetitions * set.weightInKg,
        } as const;

        return {
          ...funFacts,
          totalWeightInKg:
            funFacts.totalWeightInKg -
            totalWeightInKg.current +
            totalWeightInKg.optimistic,
        };
      });

      queryClient.setQueryData(queries.exericse, (exercise) => {
        if (!exercise) {
          return exercise;
        }

        return {
          ...exercise,
          sets: exercise.sets.map((set) => {
            if (set.id === variables.data.setId) {
              return {
                ...set,
                repetitions: variables.data.repetitions,
              };
            }

            return set;
          }),
        };
      });
    },
    onSettled: () => {
      const queries = {
        exercise: exerciseQueries.get(exercise.data.id),
        tiles: dashboardQueries.tiles,
      } as const;

      void queryClient.invalidateQueries(queries.tiles);
      void queryClient.invalidateQueries(queries.exercise);
    },
  });
};
