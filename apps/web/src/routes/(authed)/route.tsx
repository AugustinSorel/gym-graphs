import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/(authed)")({
  component: () => RouteComponent(),
  beforeLoad: async ({ context }) => {
    if (!context.user?.verifiedAt) {
      throw redirect({ to: "/sign-in" });
    }
  },
});

const RouteComponent = () => {
  return <Outlet />;
};
