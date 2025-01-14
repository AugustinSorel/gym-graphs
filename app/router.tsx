import { QueryClient } from "@tanstack/react-query";
import {
  createRouter as createTanStackRouter,
  ErrorComponentProps,
  Link,
  NotFoundRouteProps,
} from "@tanstack/react-router";
import { routeTree } from "~/routeTree.gen";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";
import { DefaultErrorFallback } from "~/components/default-error-fallback";
import { Map } from "lucide-react";
import { Button } from "~/ui/button";

export function createRouter() {
  const queryClient = new QueryClient();

  return routerWithQueryClient(
    createTanStackRouter({
      routeTree,
      context: { queryClient },
      defaultErrorComponent: (props) => RouterFallback(props),
      defaultNotFoundComponent: (props) => RouterNotFound(props),
    }),
    queryClient,
  );
}

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
      <Map className="size-32 text-accent-foreground opacity-30" />
      <h1 className="text-5xl font-semibold text-accent-foreground opacity-30">
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
