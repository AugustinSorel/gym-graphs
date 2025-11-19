import { QueryClient } from "@tanstack/react-query";
import { createRouter, Link, NotFoundRouteProps } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { MapIcon } from "~/ui/icons";
import { Button } from "~/ui/button";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const context: RouterCtx = {
    queryClient,
  };

  const router = createRouter({
    routeTree,
    context,
    scrollRestoration: true,
    defaultNotFoundComponent: RouterNotFound,
  });

  setupRouterSsrQueryIntegration({
    router,
    queryClient,
  });

  return router;
};

export type RouterCtx = {
  queryClient: QueryClient;
};

const RouterNotFound = (_props: Readonly<NotFoundRouteProps>) => {
  return (
    <main className="mx-10 my-32 flex flex-col items-center gap-2">
      <MapIcon className="text-accent-foreground size-32 opacity-30" />
      <h1 className="text-accent-foreground text-5xl font-semibold opacity-30">
        not found
      </h1>
      <h1>this ressource does not exists!</h1>
      <Button className="font-semibold capitalize" asChild>
        <Link to="/dashboard">go to dashboard</Link>
      </Button>
    </main>
  );
};
