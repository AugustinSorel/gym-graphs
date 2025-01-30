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
import { useUser } from "~/user/hooks/use-user";
import { Input } from "~/ui/input";
import { Button } from "~/ui/button";
import { createTagAction } from "~/tag/tag.actions";
import { tagSchema } from "~/tag/tag.schemas";
import { userKeys } from "~/user/user.keys";
import type { z } from "zod";

type Props = Readonly<{
  onSuccess?: () => void;
}>;

export const CreateTagForm = (props: Props) => {
  const form = useCreateTagForm();
  const createTag = useCreateTag();

  const onSubmit = async (data: CreateTagSchema) => {
    await createTag.mutateAsync(
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
                <Input placeholder="Legs..." autoFocus {...field} />
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
  const user = useUser();

  return tagSchema.pick({ name: true }).refine(
    (data) => {
      const nameTaken = user.data.tags.find((tag) => tag.name === data.name);

      return !nameTaken;
    },
    {
      message: "tag name already created",
      path: ["name"],
    },
  );
};

type CreateTagSchema = Readonly<z.infer<ReturnType<typeof useFormSchema>>>;

const useCreateTagForm = () => {
  const formSchema = useFormSchema();

  return useForm<CreateTagSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });
};

const useCreateTag = () => {
  const user = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTagAction,
    onMutate: (variables) => {
      const optimisticTag = {
        id: Math.random(),
        userId: user.data.id,
        name: variables.data.name,
        createdAt: new Date(),
        updatedAt: new Date(),
        exercises: [],
      };

      queryClient.setQueryData(userKeys.get.queryKey, (user) => {
        if (!user) {
          return user;
        }

        return {
          ...user,
          tags: [...user.tags, optimisticTag],
        };
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries(userKeys.get);
    },
  });
};
