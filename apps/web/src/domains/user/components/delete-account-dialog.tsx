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
import { Button } from "~/ui/button";
import { Spinner } from "~/ui/spinner";
import { getRouteApi } from "@tanstack/react-router";
import { useTransition } from "react";
import { Alert, AlertDescription, AlertTitle } from "~/ui/alert";
import { AlertCircleIcon } from "~/ui/icons";
import { api } from "~/libs/api";
import { parseJsonResponse } from "@gym-graphs/api";
import { useRouteHash } from "~/hooks/use-route-hash";

export const DeleteAccountDialog = () => {
  const [isRedirectPending, startRedirectTransition] = useTransition();
  const navigate = routeApi.useNavigate();
  const queryClient = useQueryClient();
  const routeHash = useRouteHash("delete-account");

  const deleteAccount = useDeleteAccount();

  const deleteAccountHandler = () => {
    deleteAccount.mutate(undefined, {
      onSuccess: () => {
        startRedirectTransition(async () => {
          await navigate({ to: "/" });
          queryClient.clear();
        });
      },
    });
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
        <Button variant="destructive" size="sm" asChild>
          <routeApi.Link hash={routeHash.hash}>delete acount</routeApi.Link>
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
        {deleteAccount.error?.message && (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>Heads up!</AlertTitle>
            <AlertDescription>{deleteAccount.error.message}</AlertDescription>
          </Alert>
        )}
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
    mutationFn: async () => {
      const req = api().users.me.$delete();

      return parseJsonResponse(req);
    },
  });
};

const routeApi = getRouteApi("/(settings)/settings");
