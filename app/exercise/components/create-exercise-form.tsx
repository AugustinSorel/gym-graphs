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
import { createExerciseAction } from "~/exercise/exercise.actions";
import { exerciseSchema } from "~/exercise/exericse.schemas";
import { useUser } from "~/user/hooks/use-user";
import { Input } from "~/ui/input";
import { Button } from "~/ui/button";
import { dashboardQueries } from "~/dashboard/dashboard.queries";
import { exerciseQueries } from "~/exercise/exercise.queries";
import type { z } from "zod";

type Props = Readonly<{
  onSuccess?: () => void;
}>;

export const CreateExerciseForm = (props: Props) => {
  const form = useCreateExerciseForm();
  const createExercise = useCreateExercise();

  const onSubmit = async (data: CreateExerciseSchema) => {
    await createExercise.mutateAsync(
      { data },
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
            className="font-semibold"
            data-umami-event="exercise created"
          >
            <span>create</span>
            {form.formState.isSubmitting && <Spinner />}
          </Button>
        </footer>
      </form>
    </Form>
  );
};

const useFormSchema = () => {
  const queryClient = useQueryClient();

  return exerciseSchema.pick({ name: true }).refine(
    (data) => {
      const queries = {
        tiles: dashboardQueries.tiles.queryKey,
      } as const;

      const cachedTiles = queryClient.getQueryData(queries.tiles);

      const nameTaken = cachedTiles?.pages
        .flatMap((page) => page.tiles)
        .find((tile) => {
          return tile.exercise?.name === data.name;
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

  return useForm<CreateExerciseSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });
};

const useCreateExercise = () => {
  const user = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createExerciseAction,
    onMutate: (variables) => {
      const queries = {
        tiles: dashboardQueries.tiles.queryKey,
        exercisesFrequency: exerciseQueries.exercisesFrequency.queryKey,
      } as const;

      const exerciseId = Math.random();

      const optimisticTile = {
        id: Math.random(),
        index: 1_0000,
        type: "exercise" as const,
        dashboardId: user.data.dashboard.id,
        exerciseId,
        exercise: {
          id: exerciseId,
          userId: user.data.id,
          name: variables.data.name,
          tags: [],
          sets: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      queryClient.setQueryData(queries.tiles, (tiles) => {
        if (!tiles) {
          return tiles;
        }

        return {
          ...tiles,
          pages: tiles.pages.map((page, i) => {
            if (i === 0) {
              return {
                ...page,
                tiles: [optimisticTile, ...page.tiles],
              };
            }

            return page;
          }),
        };
      });

      queryClient.setQueryData(queries.exercisesFrequency, (data) => {
        if (!data) {
          return data;
        }

        return [
          { name: variables.data.name, frequency: 0, id: exerciseId },
          ...data,
        ];
      });
    },
    onSettled: async () => {
      const queries = {
        tiles: dashboardQueries.tiles,
        exercisesFrequency: exerciseQueries.exercisesFrequency,
      } as const;

      void queryClient.invalidateQueries(queries.tiles);
      void queryClient.invalidateQueries(queries.exercisesFrequency);
    },
  });
};
