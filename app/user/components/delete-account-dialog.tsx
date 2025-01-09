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
import { Button } from "~/ui/button";
import { deleteAccountAction } from "~/user/user.actions";
import { Spinner } from "~/ui/spinner";
import { useNavigate } from "@tanstack/react-router";
import { useTransition } from "react";

export const DeleteAccountDialog = () => {
  const [isRedirectPending, startRedirectTransition] = useTransition();
  const navigate = useNavigate();

  const deleteAccount = useDeleteAccount();

  const deleteAccountHandler = () => {
    deleteAccount.mutate(undefined, {
      onSuccess: () => {
        startRedirectTransition(async () => {
          await navigate({ to: "/sign-up" });
        });
      },
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          delete acount
        </Button>
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
            data-umami-event="user account deleted"
            disabled={deleteAccount.isPending || isRedirectPending}
            onClick={(e) => {
              e.preventDefault();
              deleteAccountHandler();
            }}
          >
            <span>Delete</span>
            {(deleteAccount.isPending || isRedirectPending) && <Spinner />}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

const useDeleteAccount = () => {
  return useMutation({
    mutationFn: deleteAccountAction,
  });
};
