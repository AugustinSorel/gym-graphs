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
import { useUser } from "~/user/hooks/use-user";
import { Input } from "~/ui/input";
import { Button } from "~/ui/button";
import { useExercise } from "~/exercise/hooks/use-exercise";
import { updateSetWeightAction } from "~/set/set.actions";
import { setSchema } from "~/set/set.schemas";
import { useSet } from "~/set/set.context";
import { getRouteApi } from "@tanstack/react-router";

export const UpdateSetWeightForm = (props: Props) => {
  const form = useCreateExerciseForm();
  const updateWeight = useUpdateWeight();
  const set = useSet();

  const onSubmit = async (data: CreateExerciseSchema) => {
    await updateWeight.mutateAsync(
      {
        data: {
          setId: set.id,
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
            data-umami-event="update exercise set weight"
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
  return z
    .object({ weightInKg: z.coerce.number() })
    .pipe(setSchema.pick({ weightInKg: true }));
};

type CreateExerciseSchema = Readonly<z.infer<ReturnType<typeof useFormSchema>>>;

const useCreateExerciseForm = () => {
  const formSchema = useFormSchema();
  const set = useSet();

  return useForm<CreateExerciseSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      weightInKg: set.weightInKg,
    },
  });
};

const useUpdateWeight = () => {
  const queryClient = useQueryClient();
  const user = useUser();
  const params = routeApi.useParams();
  const exercise = useExercise({ id: params.exerciseId });

  return useMutation({
    mutationFn: updateSetWeightAction,
    onMutate: (variables) => {
      const keys = {
        all: exerciseKeys.all(user.data.id).queryKey,
        get: exerciseKeys.get(user.data.id, exercise.data.id).queryKey,
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
                if (set.id === variables.data.setId) {
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
            if (set.id === variables.data.setId) {
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
      void queryClient.invalidateQueries(exerciseKeys.all(user.data.id));
      void queryClient.invalidateQueries(
        exerciseKeys.get(user.data.id, exercise.data.id),
      );
    },
  });
};
