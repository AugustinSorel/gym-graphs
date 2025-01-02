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
} from "~/features/ui/alert-dialog";
import { Button } from "~/features/ui/button";
import { deleteAccountAction } from "../user.actions";
import { Spinner } from "~/features/ui/spinner";
import { useNavigate } from "@tanstack/react-router";
import { useTransition } from "react";

export const DeleteAccountDialog = () => {
  const [isRedirectPending, startRedirectTransition] = useTransition();
  const navigate = useNavigate();

  const deleteAccount = useMutation({
    mutationFn: deleteAccountAction,
    onSuccess: () => {
      startRedirectTransition(async () => {
        await navigate({ to: "/sign-up" });
      });
    },
  });

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
            disabled={deleteAccount.isPending || isRedirectPending}
            onClick={(e) => {
              e.preventDefault();
              deleteAccount.mutate(undefined);
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
