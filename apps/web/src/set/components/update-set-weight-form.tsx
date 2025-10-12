import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
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
import { Button } from "~/ui/button";
import { useExercise } from "~/exercise/hooks/use-exercise";
import { updateSetWeightAction } from "~/set/set.actions";
import { setSchema } from "~/set/set.schemas";
import { useSet } from "~/set/set.context";
import { getRouteApi } from "@tanstack/react-router";
import { dashboardQueries } from "~/dashboard/dashboard.queries";
import { userQueries } from "~/user/user.queries";
import { teamQueries } from "~/team/team.queries";
import { CounterInput } from "~/ui/counter-input";
import { WeightUnit } from "~/weight-unit/components/weight-unit";

export const UpdateSetWeightForm = (props: Props) => {
  const form = useCreateExerciseForm();
  const updateWeight = useUpdateWeight();
  const set = useSet();

  const onSubmit = async (data: CreateExerciseSchema) => {
    await updateWeight.mutateAsync(
      {
        data: {
          setId: set.id,
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
          render={() => (
            <FormItem className="flex flex-col gap-1">
              <FormLabel>
                weight (<WeightUnit />
                ):
              </FormLabel>
              <FormControl>
                <CounterInput />
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
            data-umami-event="update exercise set weight"
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

const routeApi = getRouteApi("/(exercises)/exercises/$exerciseId");

type Props = Readonly<{
  onSuccess?: () => void;
}>;

const useFormSchema = () => {
  return z
    .object({ weightInKg: z.coerce.number() })
    .pipe(setSchema.pick({ weightInKg: true }));
};

type CreateExerciseSchema = Readonly<z.infer<ReturnType<typeof useFormSchema>>>;

const useCreateExerciseForm = () => {
  const formSchema = useFormSchema();
  const set = useSet();

  return useForm<CreateExerciseSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      weightInKg: set.weightInKg,
    },
  });
};

const useUpdateWeight = () => {
  const params = routeApi.useParams();
  const exercise = useExercise(params.exerciseId);
  const set = useSet();

  return useMutation({
    mutationFn: updateSetWeightAction,
    onMutate: (variables, ctx) => {
      const queries = {
        tiles: dashboardQueries.tiles().queryKey,
        exercise: exerciseQueries.get(exercise.data.id).queryKey,
        funFacts: dashboardQueries.funFacts.queryKey,
      } as const;

      ctx.client.setQueryData(queries.tiles, (tiles) => {
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
                            weightInKg: variables.data.weightInKg,
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

      ctx.client.setQueryData(queries.funFacts, (funFacts) => {
        if (!funFacts) {
          return funFacts;
        }

        const totalWeightInKg = {
          current: set.weightInKg * set.repetitions,
          optimistic: variables.data.weightInKg * set.repetitions,
        } as const;

        return {
          ...funFacts,
          totalWeightInKg:
            funFacts.totalWeightInKg -
            totalWeightInKg.current +
            totalWeightInKg.optimistic,
        };
      });

      ctx.client.setQueryData(queries.exercise, (exercise) => {
        if (!exercise) {
          return exercise;
        }

        return {
          ...exercise,
          sets: exercise.sets.map((set) => {
            if (set.id === variables.data.setId) {
              return {
                ...set,
                weightInKg: variables.data.weightInKg,
              };
            }

            return set;
          }),
        };
      });
    },
    onSettled: (_data, _error, _variables, _res, ctx) => {
      const queries = {
        tiles: dashboardQueries.tiles(),
        exercise: exerciseQueries.get(exercise.data.id),
        funFacts: dashboardQueries.funFacts,
        user: userQueries.get,
        userAndPublicTeams: teamQueries.userAndPublicTeams(),
      } as const;

      void ctx.client.invalidateQueries(queries.tiles);
      void ctx.client.invalidateQueries(queries.exercise);
      void ctx.client.invalidateQueries(queries.funFacts);
      void ctx.client.invalidateQueries(queries.user);
      void ctx.client.invalidateQueries(queries.userAndPublicTeams);
    },
  });
};
