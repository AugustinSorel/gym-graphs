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
import { renameExerciseAction } from "~/exercise/exercise.actions";
import { exerciseSchema } from "~/exercise/exericse.schemas";
import { exerciseKeys } from "~/exercise/exercise.keys";
import { useUser } from "~/user/hooks/use-user";
import { Input } from "~/ui/input";
import { Button } from "~/ui/button";
import { getRouteApi } from "@tanstack/react-router";
import { useExercise } from "~/exercise/hooks/use-exercise";
import { userKeys } from "~/user/user.keys";
import type { z } from "zod";

export const RenameExerciseForm = (props: Props) => {
  const form = useCreateExerciseForm();
  const renameExercise = useRenameExercise();
  const params = routeApi.useParams();
  const exercise = useExercise({ id: params.exerciseId });

  const onSubmit = async (data: CreateExerciseSchema) => {
    await renameExercise.mutateAsync(
      {
        data: {
          exerciseId: exercise.data.id,
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

const routeApi = getRouteApi("/exercises_/$exerciseId/settings");

const useFormSchema = () => {
  const queryClient = useQueryClient();
  const params = routeApi.useParams();
  const user = useUser();

  return exerciseSchema.pick({ name: true }).refine(
    (data) => {
      const keys = {
        tiles: userKeys.dashboardTiles(user.data.id).queryKey,
      } as const;

      const cachedTiles = queryClient.getQueryData(keys.tiles);

      const nameTaken = cachedTiles?.find((tile) => {
        return (
          tile.exercise?.name === data.name &&
          tile.exerciseId !== params.exerciseId
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

const useCreateExerciseForm = () => {
  const formSchema = useFormSchema();
  const params = routeApi.useParams();
  const exercise = useExercise({ id: params.exerciseId });

  return useForm<CreateExerciseSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: exercise.data.name,
    },
  });
};

const useRenameExercise = () => {
  const queryClient = useQueryClient();
  const user = useUser();

  return useMutation({
    mutationFn: renameExerciseAction,
    onMutate: (variables) => {
      const keys = {
        exercise: exerciseKeys.get(user.data.id, variables.data.exerciseId)
          .queryKey,
        tiles: userKeys.dashboardTiles(user.data.id).queryKey,
      } as const;

      queryClient.setQueryData(keys.tiles, (tiles) => {
        if (!tiles) {
          return [];
        }

        return tiles.map((tile) => {
          if (tile.exercise?.id === variables.data.exerciseId) {
            return {
              ...tile,
              exercise: {
                ...tile.exercise,
                name: variables.data.name,
              },
            };
          }

          return tile;
        });
      });

      queryClient.setQueryData(keys.exercise, (exercise) => {
        if (!exercise) {
          return exercise;
        }

        return {
          ...exercise,
          name: variables.data.name,
        };
      });
    },
    onSettled: (_data, _error, variables) => {
      const keys = {
        exercise: exerciseKeys.get(user.data.id, variables.data.exerciseId),
        tiles: userKeys.dashboardTiles(user.data.id),
      } as const;

      void queryClient.invalidateQueries(keys.tiles);
      void queryClient.invalidateQueries(keys.exercise);
    },
  });
};
