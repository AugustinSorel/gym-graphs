import { ToastAction } from "@/components/ui/toast";
import { toast } from "@/components/ui/use-toast";
import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";

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
  });
