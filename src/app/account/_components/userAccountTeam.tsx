"use client";

import { signOut } from "next-auth/react";
import { Card } from "./card";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { Loader } from "@/components/ui/loader";
import { ErrorBoundary } from "react-error-boundary";
import { useUser } from "./useUser";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const UserAccountCard = () => {
  const signOutMutation = useMutation({
    mutationFn: async () => {
      return signOut({ callbackUrl: "/" });
    },
  });

  return (
    <ErrorBoundary FallbackComponent={Card.ErrorFallback}>
      <Card.Root>
        <Card.Body className="relative">
          <Card.Title>account</Card.Title>
          <Suspense fallback={<Skeleton className="h-3 w-44 bg-primary" />}>
            <Card.Description>
              Email:{" "}
              <strong>
                <UserEmail />
              </strong>
            </Card.Description>
          </Suspense>
        </Card.Body>
        <Card.Footer>
          <Button
            className="space-x-2"
            disabled={signOutMutation.isPending}
            onClick={() => {
              signOutMutation.mutate();
            }}
          >
            {signOutMutation.isPending && <Loader />}
            <span className="capitalize">sign out</span>
          </Button>
        </Card.Footer>
      </Card.Root>
    </ErrorBoundary>
  );
};

const UserEmail = () => {
  const [user] = useUser();

  return <>{user.email}</>;
};
