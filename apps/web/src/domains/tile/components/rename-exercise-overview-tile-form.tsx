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
import { exerciseQueries } from "~/domains/exercise/exercise.queries";
import { Input } from "~/ui/input";
import { Button } from "~/ui/button";
import { getRouteApi } from "@tanstack/react-router";
import { useExercise } from "~/domains/exercise/hooks/use-exercise";
import { tileSchema } from "@gym-graphs/schemas/tile";
import { api, parseJsonResponse } from "~/libs/api";
import { tileQueries } from "~/domains/tile/tile.queries";
import type { InferRequestType } from "hono";
import type { z } from "zod";

export const RenameExerciseOverviewTileForm = (props: Props) => {
  const form = useRenameExerciseTileForm();
  const renameExerciseTile = useRenameExericseTile();
  const params = routeApi.useParams();
  const exercise = useExercise(params.exerciseId);

  const onSubmit = async (data: CreateExerciseSchema) => {
    await renameExerciseTile.mutateAsync(
      {
        param: {
          tileId: exercise.data.exerciseOverviewTile.tileId.toString(),
        },
        json: {
          name: data.name,
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name:</FormLabel>
              <FormControl>
                <Input placeholder="Bench press..." autoFocus {...field} />
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
            data-umami-event="rename exercise"
            className="font-semibold"
          >
            <span>rename</span>
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

const routeApi = getRouteApi("/(exercises)/exercises_/$exerciseId/settings");

const useFormSchema = () => {
  const queryClient = useQueryClient();
  const params = routeApi.useParams();

  return tileSchema.pick({ name: true }).refine(
    (data) => {
      const queries = {
        tiles: tileQueries.all().queryKey,
      };

      const cachedTiles = queryClient.getQueryData(queries.tiles);

      const nameTaken = cachedTiles?.pages
        .flatMap((page) => page.tiles)
        .filter((tile) => tile.type === "exerciseOverview")
        .find((tile) => {
          return (
            tile.name === data.name &&
            tile.exerciseOverview.exerciseId !== params.exerciseId
          );
        });

      return !nameTaken;
    },
    {
      message: "exercise already created",
      path: ["name"],
    },
  );
};

type CreateExerciseSchema = Readonly<z.infer<ReturnType<typeof useFormSchema>>>;

const useRenameExerciseTileForm = () => {
  const formSchema = useFormSchema();
  const params = routeApi.useParams();
  const exercise = useExercise(params.exerciseId);

  return useForm<CreateExerciseSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: exercise.data.exerciseOverviewTile.tile.name,
    },
  });
};

const useRenameExericseTile = () => {
  const params = routeApi.useParams();
  const exercise = useExercise(params.exerciseId);
  const req = api().tiles[":tileId"].$patch;

  const queries = {
    exercise: exerciseQueries.get(exercise.data.id),
    tiles: tileQueries.all(),
  };

  return useMutation({
    mutationFn: async (input: InferRequestType<typeof req>) => {
      return parseJsonResponse(req(input));
    },
    onMutate: async (variables, ctx) => {
      await ctx.client.cancelQueries(queries.exercise);
      await ctx.client.cancelQueries(queries.tiles);

      const name = variables.json.name;

      if (!name) {
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
                if (tile.id.toString() === variables.param.tileId) {
                  return {
                    ...tile,
                    name,
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
          exerciseOverviewTile: {
            ...exercise.exerciseOverviewTile,
            tile: {
              ...exercise.exerciseOverviewTile.tile,
              name,
            },
          },
        };
      });
    },
    onSettled: (_data, _error, _variables, _res, ctx) => {
      void ctx.client.invalidateQueries(queries.tiles);
      void ctx.client.invalidateQueries(queries.exercise);
    },
  });
};
