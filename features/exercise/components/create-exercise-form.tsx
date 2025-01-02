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
} from "~/features/ui/form";
import { Spinner } from "~/features/ui/spinner";
import { createExerciseAction } from "~/features/exercise/exercise.actions";
import { exerciseSchema } from "~/features/exercise/exericse.schemas";
import { z } from "zod";
import { exerciseKeys } from "../exercise.keys";
import { useUser } from "~/features/context/user.context";
import { Input } from "~/features/ui/input";
import { Button } from "~/features/ui/button";

type Props = {
  onSuccess?: () => void;
};

export const CreateExerciseForm = (props: Readonly<Props>) => {
  const form = useCreateExerciseForm();
  const createExercise = useCreateExercise();

  const onSubmit = async (data: CreateExerciseSchema) => {
    await createExercise.mutateAsync(
      { data },
      {
        onSuccess: () => {
          form.reset();

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
  const user = useUser();

  return exerciseSchema.pick({ name: true }).refine(
    (data) => {
      const key = exerciseKeys.all(user.id).queryKey;
      const cachedExercises = queryClient.getQueryData(key);

      return !cachedExercises?.find((exercise) => exercise.name === data.name);
    },
    {
      message: "exercise already created",
      path: ["name"],
    },
  );
};

type CreateExerciseSchema = z.infer<ReturnType<typeof useFormSchema>>;

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
      const key = exerciseKeys.all(user.id).queryKey;

      const optimisticExercise = {
        userId: user.id,
        name: variables.data.name,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      queryClient.setQueryData(key, (exercises) => {
        if (!exercises) {
          return [];
        }

        return [optimisticExercise, ...exercises];
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries(exerciseKeys.all(user.id));
    },
  });
};
