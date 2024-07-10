import { ToastAction } from "@/components/ui/toast";
import { toast } from "@/components/ui/use-toast";
import {
  MutationCache,
  QueryCache,
  QueryClient,
  defaultShouldDehydrateQuery,
} from "@tanstack/react-query";
import SuperJSON from "superjson";

export const createQueryClient = () =>
  new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        toast({
          variant: "destructive",
          title: "Something went wrong",
          description: error.message,
          action: (
            <ToastAction altText="Try again" onClick={() => void query.fetch()}>
              Try again
            </ToastAction>
          ),
        });
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, variables, _ctx, mutation) => {
        toast({
          variant: "destructive",
          title: "Something went wrong",
          description: error.message,
          action: (
            <ToastAction
              altText="Try again"
              onClick={() => void mutation.execute(variables)}
            >
              Try again
            </ToastAction>
          ),
        });
      },
    }),
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 30 * 1000,
      },
      dehydrate: {
        serializeData: SuperJSON.serialize,
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
      hydrate: {
        deserializeData: SuperJSON.deserialize,
      },
    },
  });
