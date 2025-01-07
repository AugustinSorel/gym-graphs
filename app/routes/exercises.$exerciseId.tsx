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

      <section className="relative grid h-[500px] rounded-md border bg-secondary">
        <code>
          <pre>{JSON.stringify(exercise.data.sets, null, 2)}</pre>
        </code>
      </section>
    </Main>
  );
};

const data = [
  {
    doneAt: new Date("2025-01-02T09:51:33.261Z"),
    oneRepMax: 37,
  },
  {
    doneAt: new Date("2025-01-02T10:51:33.261Z"),
    oneRepMax: 741,
  },
  {
    doneAt: new Date("2025-01-02T11:51:33.261Z"),
    oneRepMax: 1200,
  },
  {
    doneAt: new Date("2025-01-02T12:51:33.261Z"),
    oneRepMax: 1625,
  },
  {
    doneAt: new Date("2025-01-02T13:51:33.261Z"),
    oneRepMax: 1574,
  },
  {
    doneAt: new Date("2025-01-02T14:51:33.261Z"),
    oneRepMax: 1934,
  },
  {
    doneAt: new Date("2025-01-02T15:51:33.261Z"),
    oneRepMax: 1152,
  },
  {
    doneAt: new Date("2025-01-02T16:51:33.261Z"),
    oneRepMax: 935,
  },
  {
    doneAt: new Date("2025-01-02T17:51:33.261Z"),
    oneRepMax: 2123,
  },
  {
    doneAt: new Date("2025-01-02T18:51:33.261Z"),
    oneRepMax: 1544,
  },
  {
    doneAt: new Date("2025-01-02T19:51:33.261Z"),
    oneRepMax: 20,
  },
  {
    doneAt: new Date("2025-01-02T20:51:33.261Z"),
    oneRepMax: 2655,
  },
  {
    doneAt: new Date("2025-01-02T21:51:33.261Z"),
    oneRepMax: 1841,
  },
  {
    doneAt: new Date("2025-01-02T22:51:33.261Z"),
    oneRepMax: 2212,
  },
  {
    doneAt: new Date("2025-01-02T23:51:33.261Z"),
    oneRepMax: 2390,
  },
  {
    doneAt: new Date("2025-01-03T00:51:33.261Z"),
    oneRepMax: 1745,
  },
  {
    doneAt: new Date("2025-01-03T01:51:33.261Z"),
    oneRepMax: 1523,
  },
  {
    doneAt: new Date("2025-01-03T02:51:33.261Z"),
    oneRepMax: 1920,
  },
  {
    doneAt: new Date("2025-01-03T03:51:33.261Z"),
    oneRepMax: 1031,
  },
  {
    doneAt: new Date("2025-01-03T04:51:33.261Z"),
    oneRepMax: 1865,
  },
  {
    doneAt: new Date("2025-01-03T05:51:33.261Z"),
    oneRepMax: 1152,
  },
  {
    doneAt: new Date("2025-01-03T06:51:33.261Z"),
    oneRepMax: 2003,
  },
  {
    doneAt: new Date("2025-01-03T07:51:33.261Z"),
    oneRepMax: 2458,
  },
  {
    doneAt: new Date("2025-01-03T08:51:33.261Z"),
    oneRepMax: 835,
  },
  {
    doneAt: new Date("2025-01-03T09:51:33.261Z"),
    oneRepMax: 708,
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
