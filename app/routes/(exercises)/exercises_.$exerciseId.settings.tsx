import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CatchBoundary, createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircle, ArrowLeft, Check } from "lucide-react";
import { z } from "zod";
import { DefaultErrorFallback } from "~/components/default-error-fallback";
import { DeleteExerciseTileDialog } from "~/dashboard/components/delete-exercise-tile-dialog";
import { RenameExerciseTileDialog } from "~/dashboard/components/rename-exercise-tile-dialog";
import { exerciseQueries } from "~/exercise/exercise.queries";
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
import { permissions } from "~/libs/permissions";
import { dashboardQueries } from "~/dashboard/dashboard.queries";
import type { ComponentProps } from "react";

export const Route = createFileRoute(
  "/(exercises)/exercises_/$exerciseId/settings",
)({
  params: z.object({
    exerciseId: z.coerce.number().pipe(exerciseSchema.shape.id),
  }),
  component: () => RouteComponent(),
  beforeLoad: async ({ context }) => {
    const user = permissions.exerciseSettings.view(context.user);

    return {
      user,
    };
  },
  loader: async ({ context, params }) => {
    const queries = {
      exercise: exerciseQueries.get(params.exerciseId),
    } as const;

    await context.queryClient.ensureQueryData(queries.exercise);
  },
});

const RouteComponent = () => {
  const params = Route.useParams();
  const exercise = useExercise(params.exerciseId);

  return (
    <Main>
      <Header>
        <Title>{exercise.data.tile.name} settings</Title>
        <Button
          asChild
          variant="link"
          className="text-muted-foreground w-max p-0"
        >
          <Link to="..">
            <ArrowLeft />
            <span>back</span>
          </Link>
        </Button>
      </Header>

      <Separator />

      <RenameTileSection />
      <ExerciseTagsSection />
      <DeleteTileSection />
    </Main>
  );
};

const RenameTileSection = () => {
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
          <RenameExerciseTileDialog />
        </Footer>
      </Section>
    </CatchBoundary>
  );
};

const ExerciseTagsSection = () => {
  const user = useUser();
  const params = Route.useParams();
  const exercise = useExercise(params.exerciseId);

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
          className="m-3 mt-0 flex flex-wrap justify-start gap-1 rounded-md border p-1 lg:m-6 lg:gap-4 lg:p-4"
          type="multiple"
          value={exercise.data.tile.tileToTags.map((tileToTag) => {
            return tileToTag.tag.id.toString();
          })}
          onValueChange={(e) => {
            updateExerciseTags.mutate({
              data: {
                newTags: e.map(Number),
                tileId: exercise.data.tile.id,
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
                className="group-aria-pressed:border-primary/50 group-aria-pressed:bg-primary/20 group-aria-pressed:text-primary hover:group-aria-pressed:bg-primary/30"
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

const DeleteTileSection = () => {
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
          <DeleteExerciseTileDialog />
        </Footer>
      </Section>
    </CatchBoundary>
  );
};

const Main = (props: ComponentProps<"main">) => {
  return (
    <main
      className="max-w-app mx-auto flex flex-col gap-10 px-2 pt-10 pb-20 sm:px-4 lg:gap-20 lg:pt-20"
      {...props}
    />
  );
};

const Section = ({ className, ...props }: ComponentProps<"section">) => {
  return (
    <section
      className={cn(
        "bg-secondary relative grid overflow-hidden rounded-md border",
        className,
      )}
      {...props}
    />
  );
};

const Header = (props: ComponentProps<"header">) => {
  return <header className="grid gap-2" {...props} />;
};

const Title = (props: ComponentProps<"h1">) => {
  return (
    <h1 className="truncate text-3xl font-semibold capitalize" {...props} />
  );
};

const HGroup = (props: ComponentProps<"hgroup">) => {
  return <hgroup className="space-y-3 p-3 lg:p-6" {...props} />;
};

const Footer = ({ className, ...props }: ComponentProps<"footer">) => {
  return (
    <footer
      className={cn(
        "bg-background flex items-center justify-end border-t px-3 py-4 lg:px-6",
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
      className="text-muted-foreground w-full p-6 text-center text-sm"
      {...props}
    />
  );
};

const useUpdateExerciseTags = () => {
  const user = useUser();
  const queryClient = useQueryClient();
  const params = Route.useParams();
  const exercise = useExercise(params.exerciseId);

  return useMutation({
    mutationFn: updateExerciseTagsAction,
    onMutate: (variables) => {
      const queries = {
        exercise: exerciseQueries.get(exercise.data.id).queryKey,
        tiles: dashboardQueries.tiles().queryKey,
        tilesToTagsCount: dashboardQueries.tilesToTagsCount.queryKey,
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
          tileId: variables.data.tileId,
          tagId: tag.id,
          tag,
        }));

      queryClient.setQueryData(queries.tiles, (tiles) => {
        if (!tiles) {
          return tiles;
        }

        return {
          ...tiles,
          pages: tiles.pages.map((page) => {
            return {
              ...page,
              tiles: page.tiles.map((tile) => {
                if (tile.id === variables.data.tileId) {
                  return {
                    ...tile,
                    tileToTags: optimisticTags,
                  };
                }

                return tile;
              }),
            };
          }),
        };
      });

      queryClient.setQueryData(queries.exercise, (exercise) => {
        if (!exercise) {
          return exercise;
        }

        return {
          ...exercise,
          tile: {
            ...exercise.tile,
            tileToTags: optimisticTags,
          },
        };
      });

      queryClient.setQueryData(queries.tilesToTagsCount, (tilesToTagsCount) => {
        if (!tilesToTagsCount) {
          return tilesToTagsCount;
        }

        const newExerciseTagsSet = new Set(variables.data.newTags);
        const exerciseTagsSet = new Set(
          exercise.data.tile.tileToTags.map((tileToTag) => tileToTag.tag.id),
        );

        const tagsToAddSet = newExerciseTagsSet.difference(exerciseTagsSet);
        const tagsToRemoveSet = exerciseTagsSet.difference(newExerciseTagsSet);

        return tilesToTagsCount.map((tilesToTagsCount) => {
          if (tagsToAddSet.has(tilesToTagsCount.id)) {
            return {
              ...tilesToTagsCount,
              count: tilesToTagsCount.count + 1,
            };
          }

          if (tagsToRemoveSet.has(tilesToTagsCount.id)) {
            return {
              ...tilesToTagsCount,
              count: tilesToTagsCount.count - 1,
            };
          }

          return tilesToTagsCount;
        });
      });
    },
    onSettled: () => {
      const queries = {
        exercise: exerciseQueries.get(exercise.data.id),
        tiles: dashboardQueries.tiles(),
        tilesToTagsCount: dashboardQueries.tilesToTagsCount,
      } as const;

      void queryClient.invalidateQueries(queries.tiles);
      void queryClient.invalidateQueries(queries.exercise);
      void queryClient.invalidateQueries(queries.tilesToTagsCount);
    },
  });
};
