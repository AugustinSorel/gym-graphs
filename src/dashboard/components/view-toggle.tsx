import { ToggleGroup, ToggleGroupItem } from "~/ui/toggle-group";
import { ChartLineIcon, TrendingUpDownIcon } from "~/ui/icons";
import { userSchema } from "~/user/user.schemas";
import { useUser } from "~/user/hooks/use-user";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateDashboardViewAction } from "~/user/user.actions";
import { userQueries } from "~/user/user.queries";

const useUpdateDashboadView = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateDashboardViewAction,
    onMutate: (variables) => {
      const queries = {
        user: userQueries.get.queryKey,
      } as const;

      queryClient.setQueryData(queries.user, (user) => {
        if (!user) {
          return user;
        }

        return {
          ...user,
          dashboardView: variables.data.dashboardView,
        };
      });
    },
    onSettled: () => {
      const queries = {
        user: userQueries.get,
      } as const;

      void queryClient.invalidateQueries(queries.user);
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

        updateDashboardView.mutate({ data: { dashboardView: view.data } });
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
