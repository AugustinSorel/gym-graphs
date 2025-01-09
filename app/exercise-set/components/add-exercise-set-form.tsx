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
import { Input } from "~/ui/input";
import { Button } from "~/ui/button";
import { createExerciseSetAction } from "../exercise-set.actions";
import { exerciseSetSchema } from "../exercise-set.schemas";
import { useExercise } from "~/exercise/hooks/useExercise";
import { dateAsYYYYMMDD } from "~/utils/date.utils";
import { exerciseKeys } from "~/exercise/exercise.keys";
import { useUser } from "~/user/user.context";
import { getRouteApi } from "@tanstack/react-router";

type Props = Readonly<{
  onSuccess?: () => void;
}>;

export const AddExerciseSetForm = (props: Props) => {
  const form = useCreateExerciseSetForm();
  const createExerciseSet = useCreateExerciseSet();
  const params = routeApi.useParams();
  const exericse = useExercise({ id: params.exerciseId });

  const onSubmit = async (data: CreateExerciseSchema) => {
    await createExerciseSet.mutateAsync(
      {
        data: {
          exerciseId: exericse.data.id,
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

        <FormField
          control={form.control}
          name="repetitions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>repetitions:</FormLabel>
              <FormControl>
                <Input type="number" placeholder="10" {...field} />
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

const routeApi = getRouteApi("/exercises/$exerciseId");

const useFormSchema = () => {
  const params = routeApi.useParams();
  const exericse = useExercise({ id: params.exerciseId });

  return z
    .object({
      repetitions: z.coerce.number(),
      weightInKg: z.coerce.number(),
    })
    .pipe(exerciseSetSchema.pick({ repetitions: true, weightInKg: true }))
    .refine(
      () => {
        const setAlreadyExists = exericse.data.sets.find(
          (set) => dateAsYYYYMMDD(set.doneAt) === dateAsYYYYMMDD(new Date()),
        );

        return !setAlreadyExists;
      },
      {
        message: "set already created for today",
        path: ["repetitions"],
      },
    );
};

type CreateExerciseSchema = Readonly<z.infer<ReturnType<typeof useFormSchema>>>;

const useCreateExerciseSetForm = () => {
  const formSchema = useFormSchema();

  return useForm<CreateExerciseSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      repetitions: 0,
      weightInKg: 0,
    },
  });
};

const useCreateExerciseSet = () => {
  const user = useUser();
  const params = routeApi.useParams();
  const exercise = useExercise({ id: params.exerciseId });
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createExerciseSetAction,
    onMutate: (variables) => {
      const keys = {
        all: exerciseKeys.all(user.id).queryKey,
        get: exerciseKeys.get(user.id, exercise.data.id).queryKey,
      };

      const optimisticExerciseSet = {
        id: Math.random(),
        exerciseId: variables.data.exerciseId,
        weightInKg: variables.data.weightInKg,
        repetitions: variables.data.repetitions,
        createdAt: new Date(),
        doneAt: new Date(),
        updatedAt: new Date(),
      };

      queryClient.setQueryData(keys.all, (exercises) => {
        if (!exercises) {
          return [];
        }

        return exercises.map((exercise) => {
          if (exercise.id === variables.data.exerciseId) {
            return {
              ...exercise,
              sets: [optimisticExerciseSet, ...exercise.sets],
            };
          }

          return exercise;
        });
      });

      queryClient.setQueryData(keys.get, (exercise) => {
        if (!exercise) {
          return exercise;
        }

        return {
          ...exercise,
          sets: [optimisticExerciseSet, ...exercise.sets],
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
