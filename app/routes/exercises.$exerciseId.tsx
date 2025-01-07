import { createFileRoute, redirect } from "@tanstack/react-router";
import { ComponentProps } from "react";
import { z } from "zod";
import { AddExerciseSetDialog } from "~/exercise-set/components/add-exercise-set-dialog";
import { DeleteExerciseDialog } from "~/exercise/components/delete-exercise-dialog";
import { ExerciseAdvanceOverviewGraph } from "~/exercise/components/exercise-advanced-overview-graph";
import { RenameExerciseDialog } from "~/exercise/components/rename-exercise-dialog";
import { exerciseKeys } from "~/exercise/exercise.keys";
import { exerciseSchema } from "~/exercise/exericse.schemas";
import { useExercise } from "~/exercise/hooks/useExercise";
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
  const exercise = useExercise();

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
        <ExerciseAdvanceOverviewGraph sets={exercise.data.sets} />
      </section>

      <section className="relative grid h-[500px] rounded-md border bg-secondary">
        <code>
          <pre>{JSON.stringify(exercise.data.sets, null, 2)}</pre>
        </code>
      </section>
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
  return (
    <header className="grid grid-cols-[1fr_auto_auto_auto] gap-2" {...props} />
  );
};

const Title = (props: ComponentProps<"h1">) => {
  return <h1 className="text-3xl font-semibold capitalize" {...props} />;
};
