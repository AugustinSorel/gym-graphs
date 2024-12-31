import { useMutation } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/start";
import { useTransition } from "react";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { db } from "~/db/db";
import { authGuard } from "~/features/auth/auth.middlewares";
import { invalidateSession } from "~/features/auth/auth.services";
import { deleteSessionTokenCookie } from "~/features/cookie/cookie.services";

const signOutAction = createServerFn({ method: "POST" })
  .middleware([authGuard])
  .handler(async ({ context }) => {
    await invalidateSession(context.session.id, db);
    deleteSessionTokenCookie();
  });

export const Route = createFileRoute("/")({
  component: Home,

  loader: async ({ context }) => {
    if (!context.user || !context.session) {
      throw redirect({ to: "/sign-up" });
    }

    return {
      user: context.user,
      session: context.session,
    };
  },
});

function Home() {
  const x = Route.useLoaderData();
  const [isRedirectPending, startRedirectTransition] = useTransition();
  const navigate = useNavigate();

  const signOut = useMutation({
    mutationFn: signOutAction,
    onSuccess: () => {
      startRedirectTransition(async () => {
        await navigate({ to: "/sign-in" });
      });
    },
  });

  return (
    <div>
      <code suppressHydrationWarning>{JSON.stringify(x)}</code>

      <Button
        disabled={signOut.isPending || isRedirectPending}
        onClick={() => {
          signOut.mutate({});
        }}
      >
        <span>sign out</span>
        {(signOut.isPending || isRedirectPending) && <Spinner />}
      </Button>
    </div>
  );
}
