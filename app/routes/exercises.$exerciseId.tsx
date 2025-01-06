import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { ComponentProps } from "react";
import { z } from "zod";
import { useUser } from "~/context/user.context";
import { DeleteExerciseDialog } from "~/exercise/components/delete-exercise-dialog";
import { ExerciseAdvanceOverviewGraph } from "~/exercise/components/exercise-advanced-overview-graph";
import { RenameExerciseDialog } from "~/exercise/components/rename-exercise-dialog";
import { exerciseKeys } from "~/exercise/exercise.keys";
import { exerciseSchema } from "~/exercise/exericse.schemas";
import { Separator } from "~/ui/separator";

export const Route = createFileRoute("/exercises/$exerciseId")({
  component: () => RouteComponent(),
  beforeLoad: async ({ context }) => {
    if (!context.user || !context.session) {
      throw redirect({ to: "/sign-in" });
    }

    return {
      user: context.user,
    };
  },
  params: z.object({
    exerciseId: z.coerce.number().pipe(exerciseSchema.shape.id),
  }),
  loader: async ({ context, params }) => {
    const key = exerciseKeys.get(context.user.id, params.exerciseId);

    await context.queryClient.ensureQueryData(key);
  },
});

const RouteComponent = () => {
  const user = useUser();
  const params = Route.useParams();
  const key = exerciseKeys.get(user.id, params.exerciseId);
  const exercise = useSuspenseQuery(key);

  return (
    <Main>
      <Header>
        <Title>{exercise.data.name}</Title>
        <RenameExerciseDialog />
        <DeleteExerciseDialog />
      </Header>

      <Separator />

      <section className="relative grid h-[500px] rounded-md border bg-secondary">
        <ExerciseAdvanceOverviewGraph exercisePoints={data} />
      </section>
    </Main>
  );
};

const data = [
  {
    date: new Date("2025-01-02T09:51:33.261Z"),
    weightLifted: 37,
  },
  {
    date: new Date("2025-01-02T10:51:33.261Z"),
    weightLifted: 741,
  },
  {
    date: new Date("2025-01-02T11:51:33.261Z"),
    weightLifted: 1200,
  },
  {
    date: new Date("2025-01-02T12:51:33.261Z"),
    weightLifted: 1625,
  },
  {
    date: new Date("2025-01-02T13:51:33.261Z"),
    weightLifted: 1574,
  },
  {
    date: new Date("2025-01-02T14:51:33.261Z"),
    weightLifted: 1934,
  },
  {
    date: new Date("2025-01-02T15:51:33.261Z"),
    weightLifted: 1152,
  },
  {
    date: new Date("2025-01-02T16:51:33.261Z"),
    weightLifted: 935,
  },
  {
    date: new Date("2025-01-02T17:51:33.261Z"),
    weightLifted: 2123,
  },
  {
    date: new Date("2025-01-02T18:51:33.261Z"),
    weightLifted: 1544,
  },
  {
    date: new Date("2025-01-02T19:51:33.261Z"),
    weightLifted: 20,
  },
  {
    date: new Date("2025-01-02T20:51:33.261Z"),
    weightLifted: 2655,
  },
  {
    date: new Date("2025-01-02T21:51:33.261Z"),
    weightLifted: 1841,
  },
  {
    date: new Date("2025-01-02T22:51:33.261Z"),
    weightLifted: 2212,
  },
  {
    date: new Date("2025-01-02T23:51:33.261Z"),
    weightLifted: 2390,
  },
  {
    date: new Date("2025-01-03T00:51:33.261Z"),
    weightLifted: 1745,
  },
  {
    date: new Date("2025-01-03T01:51:33.261Z"),
    weightLifted: 1523,
  },
  {
    date: new Date("2025-01-03T02:51:33.261Z"),
    weightLifted: 1920,
  },
  {
    date: new Date("2025-01-03T03:51:33.261Z"),
    weightLifted: 1031,
  },
  {
    date: new Date("2025-01-03T04:51:33.261Z"),
    weightLifted: 1865,
  },
  {
    date: new Date("2025-01-03T05:51:33.261Z"),
    weightLifted: 1152,
  },
  {
    date: new Date("2025-01-03T06:51:33.261Z"),
    weightLifted: 2003,
  },
  {
    date: new Date("2025-01-03T07:51:33.261Z"),
    weightLifted: 2458,
  },
  {
    date: new Date("2025-01-03T08:51:33.261Z"),
    weightLifted: 835,
  },
  {
    date: new Date("2025-01-03T09:51:33.261Z"),
    weightLifted: 708,
  },
];

const Main = (props: ComponentProps<"main">) => {
  return (
    <main
      className="mx-auto flex max-w-app flex-col gap-10 px-4 py-20"
      {...props}
    />
  );
};

const Header = (props: ComponentProps<"header">) => {
  return <header className="grid grid-cols-[1fr_auto_auto] gap-2" {...props} />;
};

const Title = (props: ComponentProps<"h1">) => {
  return <h1 className="text-3xl font-semibold capitalize" {...props} />;
};
