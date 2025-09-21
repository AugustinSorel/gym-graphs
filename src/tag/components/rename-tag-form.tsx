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
import { useUser } from "~/user/hooks/use-user";
import { Input } from "~/ui/input";
import { Button } from "~/ui/button";
import { renameTagAction } from "~/tag/tag.actions";
import { tagSchema } from "~/tag/tag.schemas";
import { userQueries } from "~/user/user.queries";
import { dashboardQueries } from "~/dashboard/dashboard.queries";
import { useTag } from "~/tag/tag.context";
import type { z } from "zod";

export const RenameTagForm = (props: Props) => {
  const form = useRenameTagForm();
  const renameTag = useRenameTag();
  const tag = useTag();

  const onSubmit = async (data: RenameTagSchema) => {
    await renameTag.mutateAsync(
      {
        data: {
          tagId: tag.id,
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

const useFormSchema = () => {
  const user = useUser();
  const tag = useTag();

  return tagSchema.pick({ name: true }).refine(
    (data) => {
      const nameTaken = user.data.tags.find((t) => {
        return t.name === data.name && t.id !== tag.id;
      });

      return !nameTaken;
    },
    {
      message: "tag name already created",
      path: ["name"],
    },
  );
};

type RenameTagSchema = Readonly<z.infer<ReturnType<typeof useFormSchema>>>;

const useRenameTagForm = () => {
  const formSchema = useFormSchema();
  const tag = useTag();

  return useForm<RenameTagSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: tag.name,
    },
  });
};

const useRenameTag = () => {
  return useMutation({
    mutationFn: renameTagAction,
    onMutate: (variables, ctx) => {
      const queries = {
        user: userQueries.get.queryKey,
        tilesToTagsCount: dashboardQueries.tilesToTagsCount.queryKey,
      } as const;

      ctx.client.setQueryData(queries.user, (user) => {
        if (!user) {
          return user;
        }

        return {
          ...user,
          tags: user.tags.map((tag) => {
            if (tag.id === variables.data.tagId) {
              return {
                ...tag,
                name: variables.data.name,
              };
            }

            return tag;
          }),
        };
      });

      ctx.client.setQueryData(queries.tilesToTagsCount, (tilesToTagsCount) => {
        if (!tilesToTagsCount) {
          return tilesToTagsCount;
        }

        return tilesToTagsCount.map((tileToTag) => {
          if (tileToTag.id === variables.data.tagId) {
            return {
              ...tileToTag,
              name: variables.data.name,
            };
          }

          return tileToTag;
        });
      });
    },
    onSettled: (_data, _error, _variables, _res, ctx) => {
      const queries = {
        user: userQueries.get,
        tilesToTagsCount: dashboardQueries.tilesToTagsCount,
      } as const;

      void ctx.client.invalidateQueries(queries.user);
      void ctx.client.invalidateQueries(queries.tilesToTagsCount);
    },
  });
};
