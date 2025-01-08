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
import { z } from "zod";
import { exerciseKeys } from "~/exercise/exercise.keys";
import { useUser } from "~/context/user.context";
import { Input } from "~/ui/input";
import { Button } from "~/ui/button";
import { useExercise } from "~/exercise/hooks/useExercise";
import { updateExerciseSetDoneAtAction } from "../exercise-set.actions";
import { exerciseSetSchema } from "../exercise-set.schemas";
import { useExerciseSet } from "../exercise-set.context";
import { dateAsYYYYMMDD } from "~/utils/date.utils";
import { getRouteApi } from "@tanstack/react-router";

export const UpdateExerciseSetDoneAtForm = (props: Props) => {
  const form = useUpdateExerciseSetDoneAtForm();
  const updateDoneAt = useUpdateExerciseSetDoneAt();
  const exerciseSet = useExerciseSet();

  const onSubmit = async (data: CreateExerciseSchema) => {
    await updateDoneAt.mutateAsync(
      {
        data: {
          exerciseSetId: exerciseSet.id,
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
  const exerciseSet = useExerciseSet();

  return exerciseSetSchema.pick({ doneAt: true }).refine(
    (data) => {
      const duplicateSet = exercise.data.sets.find(
        (set) =>
          dateAsYYYYMMDD(set.doneAt) === dateAsYYYYMMDD(data.doneAt) &&
          set.id !== exerciseSet.id,
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

const useUpdateExerciseSetDoneAtForm = () => {
  const formSchema = useFormSchema();
  const exerciseSet = useExerciseSet();

  return useForm<CreateExerciseSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      doneAt: exerciseSet.doneAt,
    },
  });
};

const useUpdateExerciseSetDoneAt = () => {
  const queryClient = useQueryClient();
  const user = useUser();
  const params = routeApi.useParams();
  const exercise = useExercise({ id: params.exerciseId });

  return useMutation({
    mutationFn: updateExerciseSetDoneAtAction,
    onMutate: (variables) => {
      const keys = {
        all: exerciseKeys.all(user.id).queryKey,
        get: exerciseKeys.get(user.id, exercise.data.id).queryKey,
      } as const;

      const optimisticExerciseSet = {
        doneAt: variables.data.doneAt,
      };

      queryClient.setQueryData(keys.all, (exercises) => {
        if (!exercises) {
          return [];
        }

        return exercises.map((ex) => {
          if (ex.id === exercise.data.id) {
            return {
              ...ex,
              sets: ex.sets.map((set) => {
                if (set.id === variables.data.exerciseSetId) {
                  return {
                    ...set,
                    ...optimisticExerciseSet,
                  };
                }

                return set;
              }),
            };
          }

          return ex;
        });
      });

      queryClient.setQueryData(keys.get, (ex) => {
        if (!ex) {
          return ex;
        }

        return {
          ...ex,
          sets: ex.sets.map((set) => {
            if (set.id === variables.data.exerciseSetId) {
              return {
                ...set,
                ...optimisticExerciseSet,
              };
            }

            return set;
          }),
        };
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries(exerciseKeys.all(user.id));
      void queryClient.invalidateQueries(
        exerciseKeys.get(user.id, exercise.data.id),
      );
    },
  });
};
