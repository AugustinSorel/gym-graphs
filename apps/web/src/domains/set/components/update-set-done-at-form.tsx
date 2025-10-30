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
import { exerciseQueries } from "~/domains/exercise/exercise.queries";
import { Input } from "~/ui/input";
import { Button } from "~/ui/button";
import { useExercise } from "~/domains/exercise/hooks/use-exercise";
import { setSchema } from "@gym-graphs/schemas/set";
import { useSet } from "~/domains/set/set.context";
import { dateAsYYYYMMDD } from "~/utils/date";
import { getRouteApi } from "@tanstack/react-router";
import { api, parseJsonResponse } from "~/libs/api";
import { tileQueries } from "~/domains/tile/tile.queries";
import type { InferRequestType } from "hono";
import type { z } from "zod";

export const UpdateSetDoneAtForm = (props: Props) => {
  const form = useUpdateSetDoneAtForm();
  const updateDoneAt = useUpdateSetDoneAt();
  const set = useSet();
  const params = routeApi.useParams();

  const onSubmit = async (data: CreateExerciseSchema) => {
    await updateDoneAt.mutateAsync(
      {
        param: {
          setId: set.id.toString(),
          exerciseId: params.exerciseId.toString(),
        },
        json: {
          doneAt: data.doneAt.toString(),
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
          name="doneAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>done at:</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  autoFocus
                  {...field}
                  value={field.value ? dateAsYYYYMMDD(field.value) : ""}
                  onChange={(e) => field.onChange(e.target.valueAsDate)}
                />
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
            data-umami-event="update exercise set done at"
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
  return setSchema.pick({ doneAt: true });
};

type CreateExerciseSchema = Readonly<z.infer<ReturnType<typeof useFormSchema>>>;

const useUpdateSetDoneAtForm = () => {
  const formSchema = useFormSchema();
  const set = useSet();

  return useForm<CreateExerciseSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      doneAt: new Date(set.doneAt),
    },
  });
};

const useUpdateSetDoneAt = () => {
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

      const doneAt = variables.json.doneAt?.toString();

      if (!doneAt) {
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
                              doneAt,
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

      ctx.client.setQueryData(queries.exercise.queryKey, (exexercise) => {
        if (!exexercise) {
          return exexercise;
        }

        return {
          ...exexercise,
          sets: exexercise.sets.map((set) => {
            if (set.id.toString() === variables.param.setId) {
              return {
                ...set,
                doneAt,
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
    },
  });
};
