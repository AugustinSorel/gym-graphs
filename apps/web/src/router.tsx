import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1_000,
      },
    },
  });

  const context: RouterCtx = {
    queryClient,
  };

  const router = createRouter({
    routeTree,
    context,
    scrollRestoration: true,
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
