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
import { useUser } from "~/user/user.context";
import { DropdownMenuItem } from "~/ui/dropdown-menu";
import { useState } from "react";
import { deleteTagAction } from "../tag.actions";
import { Tag } from "~/db/db.schemas";

export const DeleteTagDialog = (props: Props) => {
  const deleteTag = useDeleteTag();
  const [isOpen, setIsOpen] = useState(false);

  const deleteTagHandler = () => {
    deleteTag.mutate(
      {
        data: {
          name: props.name,
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
  const user = useUser();

  return useMutation({
    mutationFn: deleteTagAction,
    onSuccess: (_data, variables) => {
      user.set((user) => {
        return {
          ...user,
          tags: user.tags.filter((tag) => tag.name !== variables.data.name),
        };
      });
    },
  });
};

type Props = Readonly<Pick<Tag, "name">>;
