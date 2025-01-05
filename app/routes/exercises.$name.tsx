import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { ComponentProps } from "react";
import { useUser } from "~/context/user.context";
import { exerciseKeys } from "~/exercise/exercise.keys";
import { Separator } from "~/ui/separator";

export const Route = createFileRoute("/exercises/$name")({
  component: () => RouteComponent(),
  beforeLoad: async ({ context }) => {
    if (!context.user || !context.session) {
      throw redirect({ to: "/sign-in" });
    }

    return {
      user: context.user,
    };
  },
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(
      exerciseKeys.get(context.user.id, params.name),
    );
  },
});

const RouteComponent = () => {
  const user = useUser();
  const params = Route.useParams();
  const exercise = useSuspenseQuery(exerciseKeys.get(user.id, params.name));

  return (
    <Main>
      <Header>
        <Title>{exercise.data.name}</Title>
      </Header>

      <Separator />

      <code>
        <pre>{JSON.stringify(exercise, null, 4)}</pre>
      </code>
    </Main>
  );
};

const Main = (props: ComponentProps<"main">) => {
  return (
    <main
      className="mx-auto flex max-w-app flex-col gap-10 px-4 py-20"
      {...props}
    />
  );
};

const Header = (props: ComponentProps<"header">) => {
  return <header className="grid gap-2" {...props} />;
};

const Title = (props: ComponentProps<"h1">) => {
  return <h1 className="text-3xl font-semibold capitalize" {...props} />;
};
