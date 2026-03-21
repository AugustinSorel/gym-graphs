import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/(authed)/dashboard")({
  component: RouteComponent,
  beforeLoad: async ({ context }) => {
    if (!context.user?.verifiedAt) {
      throw redirect({ to: "/sign-in" });
    }
  },
});

function RouteComponent() {
  return <div>Hello "/(authed)/dashboard"!</div>;
}
