"use client";

import { Button } from "@/components/ui/button";
import { Card } from "./card";
import { ErrorBoundary } from "react-error-boundary";
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
} from "@/components/ui/alert-dialog";
import { api } from "@/trpc/react";
import { signOut } from "next-auth/react";
import { Loader } from "@/components/ui/loader";

export const DeleteUserAccountCard = () => {
  const deleteAccount = api.user.delete.useMutation({
    onSuccess: async () => {
      await signOut({ callbackUrl: "/" });
    },
  });

  return (
    <ErrorBoundary FallbackComponent={Card.ErrorFallback}>
      <Card.Root className="border-destructive">
        <Card.Body>
          <Card.Title>delete account</Card.Title>
          <Card.Description>
            Permanently remove your Personal Account and all of its contents
            from our servers. This action is not reversible, so please continue
            with caution.
          </Card.Description>
        </Card.Body>

        <Card.Footer className="flex border-destructive bg-destructive/10">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="ml-auto">
                delete account
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete
                  your account and remove your data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="capitalize">
                  cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  className="space-x-2 bg-destructive text-destructive-foreground hover:bg-destructive/80"
                  onClick={(e) => {
                    e.preventDefault();
                    void deleteAccount.mutate();
                  }}
                >
                  {deleteAccount.isPending && <Loader />}
                  <span className="capitalize">delete</span>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </Card.Footer>
      </Card.Root>
    </ErrorBoundary>
  );
};
