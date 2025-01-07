import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { ComponentProps } from "react";
import { z } from "zod";
import { useUser } from "~/context/user.context";
import { AddExerciseSetDialog } from "~/exercise-set/components/add-exercise-set-dialog";
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
        <AddExerciseSetDialog />
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
    weightInKg: 37,
    repetitions: 37,
  },
  {
    doneAt: new Date("2025-01-02T10:51:33.261Z"),
    weightInKg: 741,
    repetitions: 741,
  },
  {
    doneAt: new Date("2025-01-02T11:51:33.261Z"),
    weightInKg: 1200,
    repetitions: 1200,
  },
  {
    doneAt: new Date("2025-01-02T12:51:33.261Z"),
    weightInKg: 1625,
    repetitions: 1625,
  },
  {
    doneAt: new Date("2025-01-02T13:51:33.261Z"),
    weightInKg: 1574,
    repetitions: 1574,
  },
  {
    doneAt: new Date("2025-01-02T14:51:33.261Z"),
    weightInKg: 1934,
    repetitions: 1934,
  },
  {
    doneAt: new Date("2025-01-02T15:51:33.261Z"),
    weightInKg: 1152,
    repetitions: 1152,
  },
  {
    doneAt: new Date("2025-01-02T16:51:33.261Z"),
    weightInKg: 935,
    repetitions: 935,
  },
  {
    doneAt: new Date("2025-01-02T17:51:33.261Z"),
    weightInKg: 2123,
    repetitions: 2123,
  },
  {
    doneAt: new Date("2025-01-02T18:51:33.261Z"),
    weightInKg: 1544,
    repetitions: 1544,
  },
  {
    doneAt: new Date("2025-01-02T19:51:33.261Z"),
    weightInKg: 20,
    repetitions: 20,
  },
  {
    doneAt: new Date("2025-01-02T20:51:33.261Z"),
    weightInKg: 2655,
    repetitions: 2655,
  },
  {
    doneAt: new Date("2025-01-02T21:51:33.261Z"),
    weightInKg: 1841,
    repetitions: 1841,
  },
  {
    doneAt: new Date("2025-01-02T22:51:33.261Z"),
    weightInKg: 2212,
    repetitions: 2212,
  },
  {
    doneAt: new Date("2025-01-02T23:51:33.261Z"),
    weightInKg: 2390,
    repetitions: 2390,
  },
  {
    doneAt: new Date("2025-01-03T00:51:33.261Z"),
    weightInKg: 1745,
    repetitions: 1745,
  },
  {
    doneAt: new Date("2025-01-03T01:51:33.261Z"),
    weightInKg: 1523,
    repetitions: 1523,
  },
  {
    doneAt: new Date("2025-01-03T02:51:33.261Z"),
    weightInKg: 1920,
    repetitions: 1920,
  },
  {
    doneAt: new Date("2025-01-03T03:51:33.261Z"),
    weightInKg: 1031,
    repetitions: 1031,
  },
  {
    doneAt: new Date("2025-01-03T04:51:33.261Z"),
    weightInKg: 1865,
    repetitions: 1865,
  },
  {
    doneAt: new Date("2025-01-03T05:51:33.261Z"),
    weightInKg: 1152,
    repetitions: 1152,
  },
  {
    doneAt: new Date("2025-01-03T06:51:33.261Z"),
    weightInKg: 2003,
    repetitions: 2003,
  },
  {
    doneAt: new Date("2025-01-03T07:51:33.261Z"),
    weightInKg: 2458,
    repetitions: 2458,
  },
  {
    doneAt: new Date("2025-01-03T08:51:33.261Z"),
    weightInKg: 835,
    repetitions: 835,
  },
  {
    doneAt: new Date("2025-01-03T09:51:33.261Z"),
    weightInKg: 708,
    repetitions: 708,
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
  return (
    <header className="grid grid-cols-[1fr_auto_auto_auto] gap-2" {...props} />
  );
};

const Title = (props: ComponentProps<"h1">) => {
  return <h1 className="text-3xl font-semibold capitalize" {...props} />;
};
