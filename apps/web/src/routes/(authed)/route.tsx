import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/(authed)")({
  component: () => RouteComponent(),
});

const RouteComponent = () => {
  return <Outlet />;
};
