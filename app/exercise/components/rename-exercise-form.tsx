import { zodResolver } from "@hookform/resolvers/zod";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
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
import { z } from "zod";
import { exerciseKeys } from "~/exercise/exercise.keys";
import { useUser } from "~/context/user.context";
import { Input } from "~/ui/input";
import { Button } from "~/ui/button";
import { getRouteApi } from "@tanstack/react-router";

export const RenameExerciseForm = (props: Props) => {
  const form = useCreateExerciseForm();
  const renameExercise = useRenameExercise();
  const exercise = useExercise();

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

const routeApi = getRouteApi("/exercises/$exerciseId");

const useFormSchema = () => {
  const queryClient = useQueryClient();
  const params = routeApi.useParams();
  const user = useUser();

  return exerciseSchema.pick({ name: true }).refine(
    (data) => {
      const key = exerciseKeys.all(user.id).queryKey;
      const cachedExercises = queryClient.getQueryData(key);

      const nameTaken = cachedExercises?.find((exercise) => {
        return exercise.name === data.name && exercise.id !== params.exerciseId;
      });

      return !nameTaken;
    },
    {
      message: "exercise already created",
      path: ["name"],
    },
  );
};

const useExercise = () => {
  const user = useUser();
  const params = routeApi.useParams();
  const exercise = useSuspenseQuery(
    exerciseKeys.get(user.id, params.exerciseId),
  );

  return exercise;
};

type CreateExerciseSchema = Readonly<z.infer<ReturnType<typeof useFormSchema>>>;

const useCreateExerciseForm = () => {
  const formSchema = useFormSchema();
  const exercise = useExercise();

  return useForm<CreateExerciseSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: exercise.data.name,
    },
  });
};

const useRenameExercise = () => {
  const queryClient = useQueryClient();
  const exercise = useExercise();
  const user = useUser();

  return useMutation({
    mutationFn: renameExerciseAction,
    onMutate: (variables) => {
      const keys = {
        all: exerciseKeys.all(user.id).queryKey,
        get: exerciseKeys.get(user.id, exercise.data.id).queryKey,
      } as const;

      const optimisticExercise = {
        name: variables.data.name,
      };

      queryClient.setQueryData(keys.all, (exercises) => {
        if (!exercises) {
          return [];
        }

        return exercises.map((exercise) => {
          if (exercise.id === variables.data.exerciseId) {
            return {
              ...exercise,
              ...optimisticExercise,
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
          ...optimisticExercise,
        };
      });
    },
    onSettled: (_data, _error, variables) => {
      void queryClient.invalidateQueries(exerciseKeys.all(user.id));
      void queryClient.invalidateQueries(
        exerciseKeys.get(user.id, variables.data.exerciseId),
      );
    },
  });
};
