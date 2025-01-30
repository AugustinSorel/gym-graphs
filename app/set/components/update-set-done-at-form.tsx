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
import { exerciseKeys } from "~/exercise/exercise.keys";
import { useUser } from "~/user/hooks/use-user";
import { Input } from "~/ui/input";
import { Button } from "~/ui/button";
import { useExercise } from "~/exercise/hooks/use-exercise";
import { updateSetDoneAtAction } from "~/set/set.actions";
import { setSchema } from "~/set/set.schemas";
import { useSet } from "~/set/set.context";
import { dateAsYYYYMMDD } from "~/utils/date.utils";
import { getRouteApi } from "@tanstack/react-router";
import type { z } from "zod";
import { userKeys } from "~/user/user.key";

export const UpdateSetDoneAtForm = (props: Props) => {
  const form = useUpdateSetDoneAtForm();
  const updateDoneAt = useUpdateSetDoneAt();
  const set = useSet();

  const onSubmit = async (data: CreateExerciseSchema) => {
    await updateDoneAt.mutateAsync(
      {
        data: {
          setId: set.id,
          doneAt: data.doneAt,
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

const routeApi = getRouteApi("/exercises/$exerciseId");

type Props = Readonly<{
  onSuccess?: () => void;
}>;

const useFormSchema = () => {
  const params = routeApi.useParams();
  const exercise = useExercise({ id: params.exerciseId });
  const set = useSet();

  return setSchema.pick({ doneAt: true }).refine(
    (data) => {
      const duplicateSet = exercise.data.sets.find(
        (s) =>
          dateAsYYYYMMDD(s.doneAt) === dateAsYYYYMMDD(data.doneAt) &&
          s.id !== set.id,
      );

      return !duplicateSet;
    },
    {
      message: "set already created for this date",
      path: ["doneAt"],
    },
  );
};

type CreateExerciseSchema = Readonly<z.infer<ReturnType<typeof useFormSchema>>>;

const useUpdateSetDoneAtForm = () => {
  const formSchema = useFormSchema();
  const set = useSet();

  return useForm<CreateExerciseSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      doneAt: set.doneAt,
    },
  });
};

const useUpdateSetDoneAt = () => {
  const queryClient = useQueryClient();
  const user = useUser();
  const params = routeApi.useParams();
  const exercise = useExercise({ id: params.exerciseId });

  return useMutation({
    mutationFn: updateSetDoneAtAction,
    onMutate: (variables) => {
      const keys = {
        tiles: userKeys.getDashboardTiles(user.data.id).queryKey,
        exercise: exerciseKeys.get(user.data.id, exercise.data.id).queryKey,
      } as const;

      queryClient.setQueryData(keys.tiles, (tiles) => {
        if (!tiles) {
          return [];
        }

        return tiles.map((tile) => {
          if (tile.exercise?.id === exercise.data.id) {
            return {
              ...tile,
              exercise: {
                ...tile.exercise,
                sets: tile.exercise.sets.map((set) => {
                  if (set.id === variables.data.setId) {
                    return {
                      ...set,
                      doneAt: variables.data.doneAt,
                    };
                  }

                  return set;
                }),
              },
            };
          }

          return tile;
        });
      });

      queryClient.setQueryData(keys.exercise, (exexercise) => {
        if (!exexercise) {
          return exexercise;
        }

        return {
          ...exexercise,
          sets: exexercise.sets.map((set) => {
            if (set.id === variables.data.setId) {
              return {
                ...set,
                doneAt: variables.data.doneAt,
              };
            }

            return set;
          }),
        };
      });
    },
    onSettled: () => {
      const keys = {
        exercise: exerciseKeys.get(user.data.id, exercise.data.id),
        tiles: userKeys.getDashboardTiles(user.data.id),
      } as const;

      void queryClient.invalidateQueries(keys.tiles);
      void queryClient.invalidateQueries(keys.exercise);
    },
  });
};
