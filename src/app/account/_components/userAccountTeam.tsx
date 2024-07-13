"use client";

import { signOut } from "next-auth/react";
import { Card } from "./card";
import { Button } from "@/components/ui/button";
import { QueryErrorResetBoundary, useMutation } from "@tanstack/react-query";
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
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary FallbackComponent={Card.ErrorFallback} onReset={reset}>
          <Card.Root>
            <Card.Body className="relative">
              <Card.Title>account</Card.Title>
              <div className="space-y-1">
                <Suspense
                  fallback={<Skeleton className="h-3 w-44 bg-primary" />}
                >
                  <Card.Description>
                    Email:{" "}
                    <strong>
                      <UserEmail />
                    </strong>
                  </Card.Description>
                </Suspense>
                <Suspense
                  fallback={<Skeleton className="h-3 w-32 bg-primary" />}
                >
                  <Card.Description>
                    Username:{" "}
                    <strong>
                      <Username />
                    </strong>
                  </Card.Description>
                </Suspense>
              </div>
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
      )}
    </QueryErrorResetBoundary>
  );
};

const UserEmail = () => {
  const [user] = useUser();

  return <>{user.email}</>;
};

const Username = () => {
  const [user] = useUser();

  return <>{user.name}</>;
};
