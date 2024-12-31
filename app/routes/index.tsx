import { createFileRoute, redirect } from "@tanstack/react-router";

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

  return <>this is a private route {JSON.stringify(x)} </>;
}
