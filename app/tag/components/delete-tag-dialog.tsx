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
import { userKeys } from "~/user/user.keys";
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
    onSuccess: (_data, variables) => {
      queryClient.setQueryData(userKeys.get.queryKey, (user) => {
        if (!user) {
          return user;
        }

        return {
          ...user,
          tags: user.tags.filter((tag) => tag.id !== variables.data.tagId),
        };
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries(userKeys.get);
    },
  });
};

type Props = Readonly<{ tagId: Tag["id"] }>;
