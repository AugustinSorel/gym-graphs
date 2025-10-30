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
import { exerciseQueries } from "~/domains/exercise/exercise.queries";
import { Button } from "~/ui/button";
import { useExercise } from "~/domains/exercise/hooks/use-exercise";
import { setSchema } from "@gym-graphs/schemas/set";
import { useSet } from "~/domains/set/set.context";
import { getRouteApi } from "@tanstack/react-router";
import { CounterInput } from "~/ui/counter-input";
import { WeightUnit } from "~/domains/user/components/weight-unit";
import { api, parseJsonResponse } from "~/libs/api";
import { tileQueries } from "~/domains/tile/tile.queries";
import type { InferRequestType } from "hono";

export const UpdateSetWeightForm = (props: Props) => {
  const form = useCreateExerciseForm();
  const updateWeight = useUpdateWeight();
  const set = useSet();
  const params = routeApi.useParams();

  const onSubmit = async (data: CreateExerciseSchema) => {
    await updateWeight.mutateAsync(
      {
        param: {
          exerciseId: params.exerciseId.toString(),
          setId: set.id.toString(),
        },
        json: {
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
    .object({ weightInKg: z.number() })
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
  const req = api().exercises[":exerciseId"].sets[":setId"].$patch;

  const queries = {
    tiles: tileQueries.all(),
    exercise: exerciseQueries.get(exercise.data.id),
  };

  return useMutation({
    mutationFn: async (input: InferRequestType<typeof req>) => {
      return parseJsonResponse(req(input));
    },
    onMutate: async (variables, ctx) => {
      await ctx.client.cancelQueries(queries.tiles);
      await ctx.client.cancelQueries(queries.exercise);

      const oldTiles = ctx.client.getQueryData(queries.tiles.queryKey);
      const oldExercise = ctx.client.getQueryData(queries.exercise.queryKey);

      ctx.client.setQueryData(queries.tiles.queryKey, (tiles) => {
        const weightInKg = variables.json.weightInKg;

        if (!tiles || !weightInKg) {
          return tiles;
        }

        return {
          ...tiles,
          pages: tiles.pages.map((page) => {
            return {
              ...page,
              tiles: page.tiles.map((tile) => {
                if (tile.type !== "exerciseOverview") {
                  return tile;
                }

                if (
                  tile.exerciseOverview.exercise.id.toString() ===
                  variables.param.exerciseId
                ) {
                  return {
                    ...tile,
                    exerciseOverview: {
                      ...tile.exerciseOverview,
                      exercise: {
                        ...tile.exerciseOverview.exercise,
                        sets: tile.exerciseOverview.exercise.sets.map((set) => {
                          if (set.id.toString() === variables.param.setId) {
                            return {
                              ...set,
                              weightInKg,
                            };
                          }

                          return set;
                        }),
                      },
                    },
                  };
                }

                return tile;
              }),
            };
          }),
        };
      });

      ctx.client.setQueryData(queries.exercise.queryKey, (exercise) => {
        const weightInKg = variables.json.weightInKg;

        if (!exercise || !weightInKg) {
          return exercise;
        }

        return {
          ...exercise,
          sets: exercise.sets.map((set) => {
            if (set.id.toString() === variables.param.setId) {
              return {
                ...set,
                weightInKg,
              };
            }

            return set;
          }),
        };
      });

      return {
        oldTiles,
        oldExercise,
      };
    },
    onError: (_e, _variables, onMutateRes, ctx) => {
      ctx.client.setQueryData(queries.tiles.queryKey, onMutateRes?.oldTiles);
      ctx.client.setQueryData(
        queries.exercise.queryKey,
        onMutateRes?.oldExercise,
      );
    },
    onSettled: (_data, _error, _variables, _res, ctx) => {
      void ctx.client.invalidateQueries(queries.tiles);
      void ctx.client.invalidateQueries(queries.exercise);
    },
  });
};
