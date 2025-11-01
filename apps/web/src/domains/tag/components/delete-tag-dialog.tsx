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
import { userQueries } from "~/domains/user/user.queries";
import { useTag } from "~/domains/tag/tag.context";
import { api } from "~/libs/api";
import { parseJsonResponse } from "@gym-graphs/api";
import { getRouteApi } from "@tanstack/react-router";
import { useRouteHash } from "~/hooks/use-route-hash";
import type { InferApiReqInput } from "@gym-graphs/api";

export const DeleteTagDialog = () => {
  const deleteTag = useDeleteTag();
  const tag = useTag();
  const routeHash = useRouteHash("delete-tag");

  const deleteTagHandler = () => {
    deleteTag.mutate(
      {
        param: {
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
  const req = api().tags[":tagId"].$delete;

  const queries = {
    user: userQueries.get,
  };

  return useMutation({
    mutationFn: async (input: InferApiReqInput<typeof req>) => {
      return parseJsonResponse(api().tags[":tagId"].$delete(input));
    },
    onMutate: async (variables, ctx) => {
      await ctx.client.cancelQueries(queries.user);

      const oldUser = ctx.client.getQueryData(queries.user.queryKey);

      ctx.client.setQueryData(queries.user.queryKey, (user) => {
        if (!user) {
          return user;
        }

        return {
          ...user,
          tags: user.tags.filter((tag) => tag.id !== +variables.param.tagId),
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

const routeApi = getRouteApi("/(settings)/settings");
