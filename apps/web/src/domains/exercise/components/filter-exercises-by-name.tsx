import { CatchBoundary, getRouteApi } from "@tanstack/react-router";
import { AlertCircleIcon, SearchIcon, XIcon } from "~/ui/icons";
import { Alert, AlertDescription } from "~/ui/alert";
import { Input } from "~/ui/input";
import { useState } from "react";
import { Button } from "~/ui/button";
import { useDebouncedCallback } from "~/hooks/use-debounced-callback";
import type { ErrorComponentProps } from "@tanstack/react-router";
import type { ChangeEvent } from "react";

export const FilterExercisesByName = () => {
  const navigate = routeApi.useNavigate();
  const search = routeApi.useSearch();

  const [name, setName] = useState(search.name);

  const updateSearch = useDebouncedCallback((value: string) => {
    void navigate({
      search: (current) => {
        const { name, ...rest } = current;

        if (!value) {
          return rest;
        }

        return {
          ...current,
          name: value,
        };
      },
    });
  }, 300);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    updateSearch(value);
  };

  const clearSearch = () => {
    setName("");
    updateSearch("");
  };

  return (
    <CatchBoundary getResetKey={() => "reset"} errorComponent={SearchFallback}>
      <search className="relative">
        <Input
          type="search"
          placeholder="Search exercises..."
          className="bg-secondary h-9 pl-10"
          value={name ?? ""}
          onChange={handleChange}
        />
        <SearchIcon className="text-muted-foreground absolute top-1/2 left-4 size-4 -translate-y-1/2" />
        {name && (
          <Button
            size="icon"
            variant="ghost"
            className="text-muted-foreground absolute top-1/2 right-2 -translate-y-1/2"
            aria-label="clear search"
            onClick={() => clearSearch()}
          >
            <XIcon />
          </Button>
        )}
      </search>
    </CatchBoundary>
  );
};

const routeApi = getRouteApi("/(authed)/exercises/");

const SearchFallback = (props: ErrorComponentProps) => {
  return (
    <Alert
      variant="destructive"
      className="flex items-center gap-2 [&>svg]:relative [&>svg]:top-0 [&>svg]:left-0 [&>svg+div]:translate-y-[0px] [&>svg~*]:pl-0"
    >
      <AlertCircleIcon />
      <AlertDescription>{props.error.message}</AlertDescription>
    </Alert>
  );
};
