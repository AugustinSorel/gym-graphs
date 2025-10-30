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
import { userQueries } from "~/domains/user/user.queries";
import { CounterInput } from "~/ui/counter-input";
import { api, parseJsonResponse } from "~/libs/api";
import { tileQueries } from "~/domains/tile/tile.queries";
import type { InferRequestType } from "hono";

export const UpdateSetRepetitionsForm = (props: Props) => {
  const form = useCreateExerciseForm();
  const updateSetRepetitions = useUpdateSetRepetitions();
  const params = routeApi.useParams();
  const set = useSet();

  const onSubmit = async (data: CreateExerciseSchema) => {
    await updateSetRepetitions.mutateAsync(
      {
        param: {
          setId: set.id.toString(),
          exerciseId: params.exerciseId.toString(),
        },
        json: {
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
          render={() => (
            <FormItem className="flex flex-col gap-1">
              <FormLabel>repetitions</FormLabel>
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

const routeApi = getRouteApi("/(exercises)/exercises/$exerciseId");

type Props = Readonly<{
  onSuccess?: () => void;
}>;

const useFormSchema = () => {
  return z
    .object({ repetitions: z.number() })
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
  const params = routeApi.useParams();
  const exercise = useExercise(params.exerciseId);
  const req = api().exercises[":exerciseId"].sets[":setId"].$patch;

  const queries = {
    exercise: exerciseQueries.get(exercise.data.id),
    tiles: tileQueries.all(),
    user: userQueries.get,
  };

  return useMutation({
    mutationFn: async (input: InferRequestType<typeof req>) => {
      return parseJsonResponse(req(input));
    },
    onMutate: async (variables, ctx) => {
      await ctx.client.cancelQueries(queries.exercise);
      await ctx.client.cancelQueries(queries.tiles);
      await ctx.client.cancelQueries(queries.user);

      const repetitions = variables.json.repetitions;

      if (!repetitions) {
        return;
      }

      ctx.client.setQueryData(queries.tiles.queryKey, (tiles) => {
        if (!tiles) {
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
                  tile.exerciseOverview.exerciseId.toString() ===
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
                              repetitions,
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
        if (!exercise) {
          return exercise;
        }

        return {
          ...exercise,
          sets: exercise.sets.map((set) => {
            if (set.id.toString() === variables.param.setId) {
              return {
                ...set,
                repetitions,
              };
            }

            return set;
          }),
        };
      });
    },
    onSettled: (_data, _error, _variables, _res, ctx) => {
      void ctx.client.invalidateQueries(queries.tiles);
      void ctx.client.invalidateQueries(queries.exercise);
      void ctx.client.invalidateQueries(queries.user);
    },
  });
};
