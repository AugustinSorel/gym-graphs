import { useMutation } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/ui/alert-dialog";
import { Spinner } from "~/ui/spinner";
import { DropdownMenuItem } from "~/ui/dropdown-menu";
import { useTag } from "~/domains/tag/tag.context";
import { callApi, InferApiProps } from "~/libs/api";
import { getRouteApi } from "@tanstack/react-router";
import { useRouteHash } from "~/hooks/use-route-hash";
import { tagQueries } from "../tag.queries";

export const DeleteTagDialog = () => {
  const deleteTag = useDeleteTag();
  const tag = useTag();
  const routeHash = useRouteHash("delete-tag");

  const deleteTagHandler = () => {
    deleteTag.mutate(
      {
        path: {
          tagId: tag.id.toString(),
        },
      },
      {
        onSuccess: () => {
          routeHash.remove();
        },
      },
    );
  };

  return (
    <AlertDialog
      open={routeHash.isActive}
      onOpenChange={(prev) => {
        if (!prev) {
          routeHash.remove();
        }
      }}
    >
      <AlertDialogTrigger asChild>
        <DropdownMenuItem
          className="text-destructive focus:bg-destructive/10 focus:text-destructive"
          onSelect={(e) => e.preventDefault()}
          asChild
        >
          <routeApi.Link hash={routeHash.hash}>delete</routeApi.Link>
        </DropdownMenuItem>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your
            account and remove your data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={deleteTag.isPending}
            onClick={(e) => {
              e.preventDefault();
              deleteTagHandler();
            }}
          >
            <span>Delete</span>
            {deleteTag.isPending && <Spinner />}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

const useDeleteTag = () => {
  const queries = {
    tags: tagQueries.all,
  };

  return useMutation({
    mutationFn: async (props: InferApiProps<"Tag", "delete">) => {
      return callApi((api) => api.Tag.delete(props));
    },
    onMutate: async (variables, ctx) => {
      await ctx.client.cancelQueries(queries.tags);

      const oldTags = ctx.client.getQueryData(queries.tags.queryKey);

      ctx.client.setQueryData(queries.tags.queryKey, (tags) => {
        if (!tags) {
          return tags;
        }

        return tags.filter((tag) => tag.id !== variables.path.tagId);
      });

      return {
        oldTags,
      };
    },
    onError: (_e, _variables, onMutateResult, ctx) => {
      ctx.client.setQueryData(queries.tags.queryKey, onMutateResult?.oldTags);
    },
    onSettled: (_data, _error, _variables, _res, ctx) => {
      void ctx.client.invalidateQueries(queries.tags);
    },
  });
};

const routeApi = getRouteApi("/(authed)/settings");
