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
import { Button } from "~/ui/button";
import { setSchema } from "@gym-graphs/schemas/set";
import { useExercise } from "~/domains/exercise/hooks/use-exercise";
import { exerciseQueries } from "~/domains/exercise/exercise.queries";
import { getRouteApi } from "@tanstack/react-router";
import { CounterInput } from "~/ui/counter-input";
import { useLastSet } from "~/domains/set/hooks/use-last-set";
import { WeightUnit } from "~/domains/user/components/weight-unit";
import { api, parseJsonResponse } from "~/libs/api";
import { tileQueries } from "~/domains/tile/tile.queries";
import type { InferRequestType } from "hono";

export const CreateSetForm = (props: Props) => {
  const form = useCreateExerciseSetForm();
  const createSet = useCreateSet();
  const params = routeApi.useParams();
  const exercise = useExercise(params.exerciseId);

  const onSubmit = async (data: CreateExerciseSchema) => {
    await createSet.mutateAsync(
      {
        param: {
          exerciseId: exercise.data.id.toString(),
        },
        json: {
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

        <FormField
          control={form.control}
          name="repetitions"
          render={() => (
            <FormItem className="flex flex-col gap-1">
              <FormLabel>repetitions:</FormLabel>
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

const routeApi = getRouteApi("/(exercises)/exercises/$exerciseId");

const useFormSchema = () => {
  return z
    .object({
      repetitions: z.number(),
      weightInKg: z.number(),
    })
    .pipe(setSchema.pick({ repetitions: true, weightInKg: true }));
};

type CreateExerciseSchema = Readonly<z.infer<ReturnType<typeof useFormSchema>>>;

const useCreateExerciseSetForm = () => {
  const formSchema = useFormSchema();
  const params = routeApi.useParams();
  const exercise = useExercise(params.exerciseId);

  const lastSet = useLastSet(exercise.data.sets);

  return useForm<CreateExerciseSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      repetitions: lastSet?.repetitions ?? 0,
      weightInKg: lastSet?.weightInKg ?? 0,
    },
  });
};

const useCreateSet = () => {
  const params = routeApi.useParams();
  const exercise = useExercise(params.exerciseId);
  const req = api().exercises[":exerciseId"].sets.$post;

  const queries = {
    exercise: exerciseQueries.get(exercise.data.id),
    tiles: tileQueries.all(),
  };

  return useMutation({
    mutationFn: async (input: InferRequestType<typeof req>) => {
      return parseJsonResponse(req(input));
    },
    onMutate: (variables, ctx) => {
      const optimisticExerciseSet = {
        id: Math.random(),
        exerciseId: +variables.param.exerciseId,
        weightInKg: variables.json.weightInKg,
        repetitions: variables.json.repetitions,
        createdAt: new Date().toString(),
        doneAt: new Date().toString(),
        updatedAt: new Date().toString(),
      };

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
                        sets: [
                          optimisticExerciseSet,
                          ...tile.exerciseOverview.exercise.sets,
                        ],
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
          sets: [optimisticExerciseSet, ...exercise.sets],
        };
      });
    },
    onSettled: (_data, _error, _variables, _res, ctx) => {
      void ctx.client.invalidateQueries(queries.tiles);
      void ctx.client.invalidateQueries(queries.exercise);
    },
  });
};
