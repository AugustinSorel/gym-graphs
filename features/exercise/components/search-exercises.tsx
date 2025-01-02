import {
  CatchBoundary,
  ErrorComponentProps,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { AlertCircle, Search } from "lucide-react";
import { Alert, AlertDescription } from "~/features/ui/alert";
import { Input } from "~/features/ui/input";

export const SearchExercises = () => {
  const navigate = useNavigate({ from: "/dashboard" });
  const search = useSearch({ from: "/dashboard" });

  return (
    <CatchBoundary getResetKey={() => "reset"} errorComponent={SearchFallback}>
      <search className="relative">
        <Input
          type="search"
          placeholder="Search exercises..."
          className="bg-secondary pl-10"
          value={search.name ?? ""}
          onChange={(e) => {
            navigate({
              search: () => ({
                name: e.target.value || undefined,
              }),
            });
          }}
        />
        <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      </search>
    </CatchBoundary>
  );
};

const SearchFallback = (props: ErrorComponentProps) => {
  return (
    <Alert
      variant="destructive"
      className="flex items-center gap-2 [&>svg+div]:translate-y-[0px] [&>svg]:relative [&>svg]:left-0 [&>svg]:top-0 [&>svg~*]:pl-0"
    >
      <AlertCircle className="size-4" />
      <AlertDescription>{props.error.message}</AlertDescription>
    </Alert>
  );
};
