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
import { useState } from "react";
import { deleteTagAction } from "~/tag/tag.actions";
import { userQueries } from "~/user/user.queries";
import { dashboardQueries } from "~/dashboard/dashboard.queries";
import { useTag } from "~/tag/tag.context";

export const DeleteTagDialog = () => {
  const deleteTag = useDeleteTag();
  const [isOpen, setIsOpen] = useState(false);
  const tag = useTag();

  const deleteTagHandler = () => {
    deleteTag.mutate(
      {
        data: {
          tagId: tag.id,
        },
      },
      {
        onSuccess: () => {
          setIsOpen(false);
        },
      },
    );
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem
          className="text-destructive focus:bg-destructive/10 focus:text-destructive"
          onSelect={(e) => e.preventDefault()}
        >
          delete
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
  return useMutation({
    mutationFn: deleteTagAction,
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
          tags: user.tags.filter((tag) => tag.id !== variables.data.tagId),
        };
      });

      ctx.client.setQueryData(queries.tilesToTagsCount, (tilesToTagsCount) => {
        if (!tilesToTagsCount) {
          return tilesToTagsCount;
        }

        return tilesToTagsCount.filter((tileToTagsCount) => {
          return tileToTagsCount.id !== variables.data.tagId;
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
