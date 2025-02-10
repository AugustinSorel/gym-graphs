import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import type { Tag } from "~/db/db.schemas";

export const DeleteTagDialog = (props: Props) => {
  const deleteTag = useDeleteTag();
  const [isOpen, setIsOpen] = useState(false);

  const deleteTagHandler = () => {
    deleteTag.mutate(
      {
        data: {
          tagId: props.tagId,
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
          delete tag
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTagAction,
    onMutate: (variables) => {
      const queries = {
        user: userQueries.get.queryKey,
        tilesToTagsCount: dashboardQueries.tilesToTagsCount.queryKey,
      } as const;

      queryClient.setQueryData(queries.user, (user) => {
        if (!user) {
          return user;
        }

        return {
          ...user,
          tags: user.tags.filter((tag) => tag.id !== variables.data.tagId),
        };
      });

      queryClient.setQueryData(queries.tilesToTagsCount, (tilesToTagsCount) => {
        if (!tilesToTagsCount) {
          return tilesToTagsCount;
        }

        return tilesToTagsCount.filter((tileToTagsCount) => {
          return tileToTagsCount.id !== variables.data.tagId;
        });
      });
    },
    onSettled: () => {
      const queries = {
        user: userQueries.get,
        tilesToTagsCount: dashboardQueries.tilesToTagsCount,
      } as const;

      void queryClient.invalidateQueries(queries.user);
      void queryClient.invalidateQueries(queries.tilesToTagsCount);
    },
  });
};

type Props = Readonly<{ tagId: Tag["id"] }>;
