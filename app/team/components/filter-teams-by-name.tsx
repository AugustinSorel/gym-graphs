import { CatchBoundary, getRouteApi } from "@tanstack/react-router";
import { AlertCircle, Search, X } from "lucide-react";
import { Alert, AlertDescription } from "~/ui/alert";
import { Input } from "~/ui/input";
import { useEffect, useState } from "react";
import { useDebouncedValue } from "~/hooks/use-debounced-value";
import { Button } from "~/ui/button";
import type { ErrorComponentProps } from "@tanstack/react-router";

export const FilterTeamsByName = () => {
  const navigate = routeApi.useNavigate();
  const search = routeApi.useSearch();

  const [teamName, setTeamName] = useState(search.name ?? "");
  const debouncedTeamName = useDebouncedValue(teamName, 300);

  useEffect(() => {
    void navigate({
      search: (search) => ({
        ...search,
        name: debouncedTeamName || undefined,
      }),
    });
  }, [debouncedTeamName, navigate]);

  const clearSearch = () => {
    setTeamName("");
  };

  return (
    <CatchBoundary getResetKey={() => "reset"} errorComponent={SearchFallback}>
      <search className="relative">
        <Input
          type="search"
          placeholder="Search teams..."
          className="bg-secondary pl-10"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
        />
        <Search className="text-muted-foreground absolute top-1/2 left-4 size-4 -translate-y-1/2" />
        {teamName && (
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

const routeApi = getRouteApi("/(teams)/teams");

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
