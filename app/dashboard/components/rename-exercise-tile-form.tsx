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
import { exerciseQueries } from "~/exercise/exercise.queries";
import { Input } from "~/ui/input";
import { Button } from "~/ui/button";
import { getRouteApi } from "@tanstack/react-router";
import { useExercise } from "~/exercise/hooks/use-exercise";
import { dashboardQueries } from "~/dashboard/dashboard.queries";
import { renameTileAction } from "~/dashboard/dashboard.actions";
import { tileSchema } from "~/dashboard/dashboard.schemas";
import type { z } from "zod";

export const RenameExerciseTileForm = (props: Props) => {
  const form = useRenameExerciseTileForm();
  const renameExerciseTile = useRenameExericseTile();
  const params = routeApi.useParams();
  const exercise = useExercise(params.exerciseId);

  const onSubmit = async (data: CreateExerciseSchema) => {
    await renameExerciseTile.mutateAsync(
      {
        data: {
          tileId: exercise.data.tile.id,
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
        tiles: dashboardQueries.tiles().queryKey,
      } as const;

      const cachedTiles = queryClient.getQueryData(queries.tiles);

      const nameTaken = cachedTiles?.pages
        .flatMap((page) => page.tiles)
        .find((tile) => {
          return (
            tile.name === data.name && tile.exerciseId !== params.exerciseId
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
      name: exercise.data.tile.name,
    },
  });
};

const useRenameExericseTile = () => {
  const queryClient = useQueryClient();
  const params = routeApi.useParams();
  const exercise = useExercise(params.exerciseId);

  return useMutation({
    mutationFn: renameTileAction,
    onMutate: (variables) => {
      const queries = {
        exercise: exerciseQueries.get(exercise.data.id).queryKey,
        tiles: dashboardQueries.tiles().queryKey,
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
                if (tile.id === variables.data.tileId) {
                  return {
                    ...tile,
                    name: variables.data.name,
                  };
                }

                return tile;
              }),
            };
          }),
        };
      });

      queryClient.setQueryData(queries.exercise, (exercise) => {
        if (!exercise) {
          return exercise;
        }

        return {
          ...exercise,
          tile: {
            ...exercise.tile,
            name: variables.data.name,
          },
        };
      });
    },
    onSettled: () => {
      const queries = {
        exercise: exerciseQueries.get(exercise.data.id),
        tiles: dashboardQueries.tiles(),
      } as const;

      void queryClient.invalidateQueries(queries.tiles);
      void queryClient.invalidateQueries(queries.exercise);
    },
  });
};
