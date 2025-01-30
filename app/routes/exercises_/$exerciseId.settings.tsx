import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CatchBoundary,
  createFileRoute,
  Link,
  redirect,
} from "@tanstack/react-router";
import { AlertCircle, ArrowLeft, Check } from "lucide-react";
import { z } from "zod";
import { DefaultErrorFallback } from "~/components/default-error-fallback";
import { DeleteExerciseDialog } from "~/exercise/components/delete-exercise-dialog";
import { RenameExerciseDialog } from "~/exercise/components/rename-exercise-dialog";
import { exerciseKeys } from "~/exercise/exercise.keys";
import { exerciseSchema } from "~/exercise/exericse.schemas";
import { useExercise } from "~/exercise/hooks/use-exercise";
import { cn } from "~/styles/styles.utils";
import { CreateTagDialog } from "~/tag/components/create-tag-dialog";
import { updateExerciseTagsAction } from "~/tag/tag.actions";
import { Alert, AlertDescription, AlertTitle } from "~/ui/alert";
import { Badge } from "~/ui/badge";
import { Button } from "~/ui/button";
import { Separator } from "~/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "~/ui/toggle-group";
import { useUser } from "~/user/hooks/use-user";
import { userKeys } from "~/user/user.keys";
import type { ComponentProps } from "react";

export const Route = createFileRoute("/exercises_/$exerciseId/settings")({
  params: z.object({
    exerciseId: z.coerce.number().pipe(exerciseSchema.shape.id),
  }),
  component: () => RouteComponent(),
  beforeLoad: async ({ context }) => {
    if (!context.user?.emailVerifiedAt) {
      throw redirect({ to: "/sign-in" });
    }

    return {
      user: context.user,
    };
  },
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
        <Button
          asChild
          variant="link"
          className="w-max p-0 text-muted-foreground"
        >
          <Link to="..">
            <ArrowLeft />
            <span>back</span>
          </Link>
        </Button>
      </Header>

      <Separator />

      <RenameExerciseSection />
      <ExerciseTagsSection />
      <DeleteExerciseSection />
    </Main>
  );
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

const ExerciseTagsSection = () => {
  const user = useUser();
  const params = Route.useParams();
  const exercise = useExercise({ id: params.exerciseId });

  const updateExerciseTags = useUpdateExerciseTags();

  return (
    <CatchBoundary
      errorComponent={DefaultErrorFallback}
      getResetKey={() => "reset"}
    >
      <Section>
        <HGroup>
          <SectionTitle>exercise tags</SectionTitle>
          <SectionDescription>
            Feel free to rename this exercise to somehting more comfortable.
            Your exercises name are not public.
          </SectionDescription>
        </HGroup>

        <ToggleGroup
          className="m-6 mt-0 flex flex-wrap justify-start gap-4 rounded-md border p-4"
          type="multiple"
          value={exercise.data.tags.map((tag) => tag.tagId.toString())}
          onValueChange={(e) => {
            updateExerciseTags.mutate({
              data: {
                newTags: e.map(Number),
                exerciseId: exercise.data.id,
              },
            });
          }}
        >
          {!user.data.tags.length && <NoTagsText>no tags</NoTagsText>}
          {user.data.tags.map((tag) => (
            <ToggleGroupItem
              key={tag.id}
              className="group hover:bg-transparent data-[state=on]:bg-transparent [&_svg]:size-3"
              value={tag.id.toString()}
            >
              <Badge
                className="group-aria-pressed:border-primary/50 group-aria-pressed:bg-primary/20 group-aria-pressed:text-primary group-aria-pressed:hover:bg-primary/30"
                variant="outline"
              >
                <Check className="mr-1 hidden group-aria-pressed:block" />
                {tag.name}
              </Badge>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        {updateExerciseTags.error && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Heads up!</AlertTitle>
            <AlertDescription>
              {updateExerciseTags.error.message}
            </AlertDescription>
          </Alert>
        )}

        <Footer>
          <CreateTagDialog />
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

const Main = (props: ComponentProps<"main">) => {
  return (
    <main
      className="mx-auto flex max-w-app flex-col gap-10 px-2 pb-20 pt-10 sm:px-4 lg:gap-20 lg:pt-20"
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
  return <header className="grid gap-x-2" {...props} />;
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

const NoTagsText = (props: ComponentProps<"p">) => {
  return (
    <p
      className="w-full p-6 text-center text-sm text-muted-foreground"
      {...props}
    />
  );
};

const useUpdateExerciseTags = () => {
  const user = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateExerciseTagsAction,
    onMutate: (variables) => {
      const keys = {
        exercise: exerciseKeys.get(user.data.id, variables.data.exerciseId)
          .queryKey,
        tiles: userKeys.dashboardTiles(user.data.id).queryKey,
        user: userKeys.get.queryKey,
      };

      const newExerciseTags = new Set(variables.data.newTags);

      const optimisticTags = user.data.tags
        .filter((tag) => {
          if (!newExerciseTags.has(tag.id)) {
            return false;
          }

          return true;
        })
        .map((tag) => ({
          createdAt: new Date(),
          updatedAt: new Date(),
          exerciseId: variables.data.exerciseId,
          tagId: tag.id,
          tag,
        }));

      queryClient.setQueryData(keys.tiles, (tiles) => {
        if (!tiles) {
          return tiles;
        }

        return tiles.map((tile) => {
          if (tile.exercise?.id === variables.data.exerciseId) {
            return {
              ...tile,
              exercise: {
                ...tile.exercise,
                tags: optimisticTags,
              },
            };
          }

          return tile;
        });
      });

      queryClient.setQueryData(keys.exercise, (exercise) => {
        if (!exercise) {
          return exercise;
        }

        return {
          ...exercise,
          tags: optimisticTags,
        };
      });

      queryClient.setQueryData(keys.user, (user) => {
        if (!user) {
          return user;
        }

        return {
          ...user,
          tags: user.tags.map((tag) => {
            return {
              ...tag,
              exercises: tag.exercises.filter((exercise) => {
                if (!newExerciseTags.has(exercise.tagId)) {
                  return false;
                }

                return true;
              }),
            };
          }),
        };
      });
    },
    onSettled: (_data, _error, variables) => {
      const keys = {
        exercise: exerciseKeys.get(user.data.id, variables.data.exerciseId),
        tiles: userKeys.dashboardTiles(user.data.id),
        user: userKeys.get,
      } as const;

      void queryClient.invalidateQueries(keys.tiles);
      void queryClient.invalidateQueries(keys.exercise);
      void queryClient.invalidateQueries(keys.user);
    },
  });
};
