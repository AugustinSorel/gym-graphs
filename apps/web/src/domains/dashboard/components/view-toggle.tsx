import { ToggleGroup, ToggleGroupItem } from "~/ui/toggle-group";
import { ChartLineIcon, TrendingUpDownIcon } from "~/ui/icons";
import { userSchema } from "@gym-graphs/schemas/user";
import { useUser } from "~/domains/user/hooks/use-user";
import { useMutation } from "@tanstack/react-query";
import { userQueries } from "~/domains/user/user.queries";
import { api } from "~/libs/api";
import { parseJsonResponse } from "@gym-graphs/api";
import type { InferApiReqInput } from "@gym-graphs/api";

const useUpdateDashboadView = () => {
  const req = api().users.me.$patch;

  const queries = {
    user: userQueries.get,
  };

  return useMutation({
    mutationFn: async (input: InferApiReqInput<typeof req>) => {
      return parseJsonResponse(req(input));
    },
    onMutate: async (variables, ctx) => {
      await ctx.client.cancelQueries(queries.user);

      const oldUser = ctx.client.getQueryData(queries.user.queryKey);

      ctx.client.setQueryData(queries.user.queryKey, (user) => {
        if (!user || !variables.json.dashboardView) {
          return user;
        }

        return {
          ...user,
          dashboardView: variables.json.dashboardView,
        };
      });

      return {
        oldUser,
      };
    },
    onError: (_e, _variables, onMutateResult, ctx) => {
      ctx.client.setQueryData(queries.user.queryKey, onMutateResult?.oldUser);
    },
    onSettled: (_data, _error, _variables, _res, ctx) => {
      void ctx.client.invalidateQueries(queries.user);
    },
  });
};

export const ViewToggle = () => {
  const user = useUser();
  const updateDashboardView = useUpdateDashboadView();

  return (
    <ToggleGroup
      type="single"
      className="bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md border p-0.5 shadow-xs"
      value={user.data.dashboardView}
      onValueChange={(unsafeView) => {
        const view = userSchema.shape.dashboardView.safeParse(unsafeView);

        if (!view.success) {
          return;
        }

        updateDashboardView.mutate({ json: { dashboardView: view.data } });
      }}
    >
      <ToggleGroupItem
        value={userSchema.shape.dashboardView.enum.graph}
        aria-label="Toggle grid"
        size="sm"
      >
        <ChartLineIcon />
      </ToggleGroupItem>
      <ToggleGroupItem
        value={userSchema.shape.dashboardView.enum.trending}
        aria-label="Toggle list"
        size="sm"
      >
        <TrendingUpDownIcon />
      </ToggleGroupItem>
    </ToggleGroup>
  );
};
