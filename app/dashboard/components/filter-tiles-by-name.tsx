import { CatchBoundary, getRouteApi } from "@tanstack/react-router";
import { AlertCircle, Search, X } from "lucide-react";
import { Alert, AlertDescription } from "~/ui/alert";
import { Input } from "~/ui/input";
import { useEffect, useState } from "react";
import { useDebouncedValue } from "~/hooks/use-debounced-value";
import { Button } from "~/ui/button";
import type { ErrorComponentProps } from "@tanstack/react-router";

export const FilterTilesByName = () => {
  const navigate = routeApi.useNavigate();
  const search = routeApi.useSearch();

  const [tileName, setTileName] = useState(search.name ?? "");
  const debouncedTileName = useDebouncedValue(tileName, 300);

  useEffect(() => {
    void navigate({
      search: (search) => ({
        ...search,
        name: debouncedTileName || undefined,
      }),
    });
  }, [debouncedTileName, navigate]);

  const clearSearch = () => {
    setTileName("");
  };

  return (
    <CatchBoundary getResetKey={() => "reset"} errorComponent={SearchFallback}>
      <search className="relative">
        <Input
          type="search"
          placeholder="Search tiles..."
          className="bg-secondary pl-10"
          value={tileName}
          onChange={(e) => setTileName(e.target.value)}
        />
        <Search className="text-muted-foreground absolute top-1/2 left-4 size-4 -translate-y-1/2" />
        {tileName && (
          <Button
            size="icon"
            variant="ghost"
            className="text-muted-foreground absolute top-1/2 right-2 -translate-y-1/2"
            aria-label="clear search"
            onClick={() => clearSearch()}
          >
            <X />
          </Button>
        )}
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
