import { QueryClient } from "@tanstack/react-query";
import {
  createRouter as createTanStackRouter,
  ErrorComponentProps,
} from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";
import { DefaultErrorFallback } from "~/features/components/default-error-fallback";

export function createRouter() {
  const queryClient = new QueryClient();

  return routerWithQueryClient(
    createTanStackRouter({
      routeTree,
      context: { queryClient },
      defaultErrorComponent: (props) => RouterFallback(props),
    }),
    queryClient,
  );
}

const RouterFallback = (props: ErrorComponentProps) => {
  return (
    <main className="m-10">
      <DefaultErrorFallback {...props} />
    </main>
  );
};

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
