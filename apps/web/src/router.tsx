import { QueryClient } from "@tanstack/react-query";
import {
  createRouter as createTanStackRouter,
  Link,
} from "@tanstack/react-router";
import { routeTree } from "~/routeTree.gen";
import { DefaultErrorFallback } from "~/components/default-error-fallback";
import { MapIcon } from "~/ui/icons";
import { Button } from "~/ui/button";
import type {
  ErrorComponentProps,
  NotFoundRouteProps,
} from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";

export const createRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1_000,
      },
    },
  });

  const router = createTanStackRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultErrorComponent: (props) => RouterFallback(props),
    defaultNotFoundComponent: (props) => RouterNotFound(props),
  });

  setupRouterSsrQueryIntegration({
    router,
    queryClient,
  });

  return router;
};

const RouterFallback = (props: Readonly<ErrorComponentProps>) => {
  return (
    <main className="m-10">
      <DefaultErrorFallback {...props} />
    </main>
  );
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

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
