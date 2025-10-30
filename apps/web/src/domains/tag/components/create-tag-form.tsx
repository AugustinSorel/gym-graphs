import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
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
import { useUser } from "~/domains/user/hooks/use-user";
import { Input } from "~/ui/input";
import { Button } from "~/ui/button";
import { tagSchema } from "@gym-graphs/schemas/tag";
import { userQueries } from "~/domains/user/user.queries";
import type { z } from "zod";
import { api, parseJsonResponse } from "~/libs/api";
import { InferRequestType } from "hono";

export const CreateTagForm = (props: Props) => {
  const form = useCreateTagForm();
  const createTag = useCreateTag();

  const onSubmit = async (data: CreateTagSchema) => {
    await createTag.mutateAsync(
      { json: data },
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

type Props = Readonly<{
  onSuccess?: () => void;
}>;

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
  const req = api().tags.$post;

  const queries = {
    user: userQueries.get,
  };

  return useMutation({
    mutationFn: async (input: InferRequestType<typeof req>) => {
      return parseJsonResponse(req(input));
    },
    onMutate: async (variables, ctx) => {
      await ctx.client.cancelQueries(userQueries.get);

      const oldUser = ctx.client.getQueryData(queries.user.queryKey);

      const optimisticTag = {
        id: Math.random(),
        userId: user.data.id,
        name: variables.json.name,
        createdAt: new Date().toString(),
        updatedAt: new Date().toString(),
        exercises: [],
      };

      ctx.client.setQueryData(queries.user.queryKey, (user) => {
        if (!user) {
          return user;
        }

        return {
          ...user,
          tags: [...user.tags, optimisticTag],
        };
      });

      return {
        oldUser,
      };
    },
    onError: (_e, _variables, onMutateResult, ctx) => {
      ctx.client.setQueryData(queries.user.queryKey, onMutateResult?.oldUser);
    },
    onSettled: (_data, _error, _variables, _res, ctx) => {
      void ctx.client.invalidateQueries(queries.user);
    },
  });
};
