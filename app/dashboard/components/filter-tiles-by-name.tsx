import { CatchBoundary, getRouteApi } from "@tanstack/react-router";
import { AlertCircle, Search } from "lucide-react";
import { Alert, AlertDescription } from "~/ui/alert";
import { Input } from "~/ui/input";
import type { ErrorComponentProps } from "@tanstack/react-router";

export const FilterTilesByName = () => {
  const navigate = routeApi.useNavigate();
  const search = routeApi.useSearch();

  return (
    <CatchBoundary getResetKey={() => "reset"} errorComponent={SearchFallback}>
      <search className="relative">
        <Input
          type="search"
          placeholder="Search tiles..."
          className="bg-secondary pl-10"
          value={search.name ?? ""}
          onChange={(e) => {
            void navigate({
              search: (search) => ({
                ...search,
                name: e.target.value || undefined,
              }),
            });
          }}
        />
        <Search className="text-muted-foreground absolute top-1/2 left-4 size-4 -translate-y-1/2" />
      </search>
    </CatchBoundary>
  );
};

const routeApi = getRouteApi("/dashboard/");

const SearchFallback = (props: ErrorComponentProps) => {
  return (
    <Alert
      variant="destructive"
      className="flex items-center gap-2 [&>svg]:relative [&>svg]:top-0 [&>svg]:left-0 [&>svg+div]:translate-y-[0px] [&>svg~*]:pl-0"
    >
      <AlertCircle className="size-4" />
      <AlertDescription>{props.error.message}</AlertDescription>
    </Alert>
  );
};
