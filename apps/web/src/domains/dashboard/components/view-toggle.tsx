import { ToggleGroup, ToggleGroupItem } from "~/ui/toggle-group";
import { ChartLineIcon, TrendingUpDownIcon } from "~/ui/icons";
import { useUser } from "~/domains/user/hooks/use-user";
import { useMutation } from "@tanstack/react-query";
import { userQueries } from "~/domains/user/user.queries";
import { callApi, InferApiProps } from "~/libs/api";
import { UserSchema } from "@gym-graphs/shared/user/schemas";
import { decodeUnknownOption } from "effect/ParseResult";
import { Effect } from "effect";

const useUpdateDashboadView = () => {
  const queries = {
    user: userQueries.get,
  };

  return useMutation({
    mutationFn: async (
      payload: Pick<InferApiProps<"User", "patch">["payload"], "dashboardView">,
    ) => {
      return callApi((api) => api.User.patch({ payload }));
    },
    onMutate: async (variables, ctx) => {
      await ctx.client.cancelQueries(queries.user);

      const oldUser = ctx.client.getQueryData(queries.user.queryKey);

      ctx.client.setQueryData(queries.user.queryKey, (user) => {
        if (!user || !variables.dashboardView) {
          return user;
        }

        return {
          ...user,
          dashboardView: variables.dashboardView,
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
        decodeUnknownOption(UserSchema.fields.dashboardView)(unsafeView).pipe(
          Effect.andThen((dashboardView) => {
            updateDashboardView.mutate({ dashboardView });
          }),
        );
      }}
    >
      <ToggleGroupItem
        value={UserSchema.fields.dashboardView.literals[0]}
        aria-label="Toggle grid"
        size="sm"
      >
        <ChartLineIcon />
      </ToggleGroupItem>
      <ToggleGroupItem
        value={UserSchema.fields.dashboardView.literals[1]}
        aria-label="Toggle list"
        size="sm"
      >
        <TrendingUpDownIcon />
      </ToggleGroupItem>
    </ToggleGroup>
  );
};
