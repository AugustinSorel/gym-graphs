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
import { updateExerciseSetWeightAction } from "../exercise-set.actions";
import { exerciseSetSchema } from "../exercise-set.schemas";
import { useExerciseSet } from "../exercise-set.context";

export const UpdateExerciseSetWeightForm = (props: Props) => {
  const form = useCreateExerciseForm();
  const renameExercise = useRenameExercise();
  const exerciseSet = useExerciseSet();

  const onSubmit = async (data: CreateExerciseSchema) => {
    await renameExercise.mutateAsync(
      {
        data: {
          exerciseSetId: exerciseSet.id,
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
          render={({ field }) => (
            <FormItem>
              <FormLabel>weight:</FormLabel>
              <FormControl>
                <Input type="number" placeholder="75" autoFocus {...field} />
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

type Props = Readonly<{
  onSuccess?: () => void;
}>;

const useFormSchema = () => {
  return z
    .object({ weightInKg: z.coerce.number() })
    .pipe(exerciseSetSchema.pick({ weightInKg: true }));
};

type CreateExerciseSchema = Readonly<z.infer<ReturnType<typeof useFormSchema>>>;

const useCreateExerciseForm = () => {
  const formSchema = useFormSchema();
  const exerciseSet = useExerciseSet();

  return useForm<CreateExerciseSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      weightInKg: exerciseSet.weightInKg,
    },
  });
};

const useRenameExercise = () => {
  const queryClient = useQueryClient();
  const user = useUser();
  const exercise = useExercise();

  return useMutation({
    mutationFn: updateExerciseSetWeightAction,
    onMutate: (variables) => {
      const keys = {
        all: exerciseKeys.all(user.id).queryKey,
        get: exerciseKeys.get(user.id, exercise.data.id).queryKey,
      } as const;

      const optimisticExerciseSet = {
        weightInKg: variables.data.weightInKg,
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
