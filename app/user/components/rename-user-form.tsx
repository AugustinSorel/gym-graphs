import { Button } from "~/ui/button";
import {
  Form,
  FormAlert,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/ui/form";
import { Input } from "~/ui/input";
import { Spinner } from "~/ui/spinner";
import { userSchema } from "~/user/user.schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useUser } from "~/user/user.context";
import type { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { renameUserAction } from "~/user/user.actions";
import { userKey } from "../user.key";

type Props = {
  onSuccess?: () => void;
};

export const RenameUserForm = (props: Props) => {
  const form = useCreateExerciseForm();
  const renameUser = useRenameUser();

  const onSubmit = async (data: RenameUserSchema) => {
    await renameUser.mutateAsync(
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
                <Input placeholder="John..." autoFocus {...field} />
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
            data-umami-event="user renamed"
          >
            <span>rename</span>
            {form.formState.isSubmitting && <Spinner />}
          </Button>
        </footer>
      </form>
    </Form>
  );
};

const renameUserSchema = userSchema.pick({ name: true });
type RenameUserSchema = z.infer<typeof renameUserSchema>;

const useCreateExerciseForm = () => {
  const user = useUser();

  return useForm<RenameUserSchema>({
    resolver: zodResolver(renameUserSchema),
    defaultValues: {
      name: user.name,
    },
  });
};

const useRenameUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: renameUserAction,
    onMutate: (variables) => {
      queryClient.setQueryData(userKey.get.queryKey, (user) => {
        if (!user) {
          return user;
        }

        return {
          ...user,
          name: variables.data.name,
        };
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries(userKey.get);
    },
  });
};
