import {
  createFileRoute,
  redirect,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { Input } from "~/features/ui/input";
import { exerciseKeys } from "~/features/exercise/exercise.keys";
import { UserProvider } from "~/features/context/user.context";
import { ExercisesGrid } from "~/features/exercise/components/exercises-grid";
import { CreateExerciseDialog } from "~/features/exercise/components/create-exercise-dialog";
import { ComponentProps, useState } from "react";
import { Search } from "lucide-react";
import { z } from "zod";

export const Route = createFileRoute("/dashboard")({
  component: () => RouteComponent(),
  beforeLoad: async ({ context }) => {
    if (!context.user || !context.session) {
      throw redirect({ to: "/sign-in" });
    }

    return {
      user: context.user,
    };
  },
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(
      exerciseKeys.all(context.user.id),
    );

    return {
      user: context.user,
    };
  },
  validateSearch: z.object({
    name: z.string().optional(),
  }),
});

const RouteComponent = () => {
  const loaderData = Route.useLoaderData();

  return (
    <UserProvider user={loaderData.user}>
      <Main>
        <Header>
          <SearchExercises />
          <CreateExerciseDialog />
        </Header>

        <ExercisesGrid />
      </Main>
    </UserProvider>
  );
};

const SearchExercises = () => {
  const navigate = useNavigate({ from: "/dashboard" });
  const search = useSearch({ from: "/dashboard" });

  const [exerciseName, setExerciseName] = useState(search.name || "");

  return (
    <search className="relative">
      <Input
        type="search"
        placeholder="Search exercises..."
        className="bg-secondary pl-10"
        value={exerciseName}
        onChange={(e) => {
          setExerciseName(e.target.value);

          navigate({
            search: () => ({
              name: e.target.value || undefined,
            }),
          });
        }}
      />
      <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </search>
  );
};

const Main = (props: ComponentProps<"main">) => {
  return (
    <main
      className="mx-auto flex max-w-app flex-col gap-20 px-4 py-20"
      {...props}
    />
  );
};

const Header = (props: ComponentProps<"header">) => {
  return <header className="grid grid-cols-[1fr_auto] gap-2" {...props} />;
};
