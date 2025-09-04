import { ToggleGroup, ToggleGroupItem } from "~/ui/toggle-group";
import { GridIcon, ListIcon } from "~/ui/icons";
import { getRouteApi } from "@tanstack/react-router";
import { dashboardViewSchema } from "~/dashboard/dashboard.schemas";

export const ViewToggle = () => {
  const search = routeApi.useSearch();
  const navigate = routeApi.useNavigate();

  //TODO: from user obj
  const view = search.view ?? "grid";

  return (
    <ToggleGroup
      type="single"
      className="bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md border p-0.5 shadow-xs"
      value={view}
      onValueChange={(unsafeView) => {
        const view = dashboardViewSchema.safeParse(unsafeView);

        if (!view.success) {
          return;
        }

        void navigate({
          search: (search) => ({
            ...search,
            view: view.data,
          }),
        });
      }}
    >
      <ToggleGroupItem value="grid" aria-label="Toggle grid" size="sm">
        <GridIcon />
      </ToggleGroupItem>
      <ToggleGroupItem value="list" aria-label="Toggle list" size="sm">
        <ListIcon />
      </ToggleGroupItem>
    </ToggleGroup>
  );
};

const routeApi = getRouteApi("/(dashboard)/dashboard");
