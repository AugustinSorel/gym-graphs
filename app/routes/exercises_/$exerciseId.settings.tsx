import { Separator } from "@radix-ui/react-separator";
import {
  CatchBoundary,
  createFileRoute,
  redirect,
} from "@tanstack/react-router";
import { ComponentProps } from "react";
import { z } from "zod";
import { DefaultErrorFallback } from "~/components/default-error-fallback";
import { DeleteExerciseDialog } from "~/exercise/components/delete-exercise-dialog";
import { RenameExerciseDialog } from "~/exercise/components/rename-exercise-dialog";
import { exerciseKeys } from "~/exercise/exercise.keys";
import { exerciseSchema } from "~/exercise/exericse.schemas";
import { useExercise } from "~/exercise/hooks/useExercise";
import { cn } from "~/styles/styles.utils";

export const Route = createFileRoute("/exercises_/$exerciseId/settings")({
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
  const params = Route.useParams();
  const exercise = useExercise({ id: params.exerciseId });

  return (
    <Main>
      <Header>
        <Title>{exercise.data.name} settings</Title>
      </Header>

      <Separator />

      <RenameExerciseSection />
      <DeleteExerciseSection />
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

const Section = ({ className, ...props }: ComponentProps<"section">) => {
  return (
    <section
      className={cn(
        "relative grid overflow-hidden rounded-md border bg-secondary",
        className,
      )}
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
  return (
    <h1 className="truncate text-3xl font-semibold capitalize" {...props} />
  );
};

const HGroup = (props: ComponentProps<"hgroup">) => {
  return <hgroup className="space-y-3 p-6" {...props} />;
};

const Footer = ({ className, ...props }: ComponentProps<"footer">) => {
  return (
    <footer
      className={cn(
        "flex items-center justify-end border-t bg-background px-6 py-4",
        className,
      )}
      {...props}
    />
  );
};

const SectionTitle = (props: ComponentProps<"h2">) => {
  return <h2 className="text-xl font-semibold capitalize" {...props} />;
};

const SectionDescription = (props: ComponentProps<"p">) => {
  return <p className="text-sm" {...props} />;
};

const RenameExerciseSection = () => {
  return (
    <CatchBoundary
      errorComponent={DefaultErrorFallback}
      getResetKey={() => "reset"}
    >
      <Section>
        <HGroup>
          <SectionTitle>rename exercise</SectionTitle>
          <SectionDescription>
            Feel free to rename this exercise to somehting more comfortable.
            Your exercises name are not public.
          </SectionDescription>
        </HGroup>
        <Footer>
          <RenameExerciseDialog />
        </Footer>
      </Section>
    </CatchBoundary>
  );
};

const DeleteExerciseSection = () => {
  return (
    <CatchBoundary
      errorComponent={DefaultErrorFallback}
      getResetKey={() => "reset"}
    >
      <Section className="border-destructive">
        <HGroup>
          <SectionTitle>delete exercise</SectionTitle>
          <SectionDescription>
            Permanently remove your this exercise and all of its contents from
            our servers. This action is not reversible, so please continue with
            caution.
          </SectionDescription>
        </HGroup>
        <Footer className="border-destructive bg-destructive/10">
          <DeleteExerciseDialog />
        </Footer>
      </Section>
    </CatchBoundary>
  );
};
