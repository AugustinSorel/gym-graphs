import { useMutation } from "@tanstack/react-query";
import { CatchBoundary, createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircleIcon, ArrowLeftIcon, CheckIcon } from "~/ui/icons";
import { z } from "zod";
import { DefaultErrorFallback } from "~/components/default-error-fallback";
import { DeleteExerciseTileDialog } from "~/dashboard/components/delete-exercise-tile-dialog";
import { RenameExerciseTileDialog } from "~/dashboard/components/rename-exercise-tile-dialog";
import { exerciseQueries } from "~/exercise/exercise.queries";
import { exerciseSchema } from "~/exercise/exericse.schemas";
import { useExercise } from "~/exercise/hooks/use-exercise";
import { cn } from "~/styles/styles.utils";
import { CreateTagDialog } from "~/tag/components/create-tag-dialog";
import { addTagToTileAction, removeTagToTileAction } from "~/tag/tag.actions";
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
            <ArrowLeftIcon />
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

  const addTagToTile = useAddTagToTile();
  const removeTagToTile = useRemoveTagToTile();

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
          onValueChange={(newTagsIdsStr) => {
            const currentTagsIds = exercise.data.tile.tileToTags.map(
              (tileToTag) => tileToTag.tag.id,
            );
            const newTagsIds = newTagsIdsStr.map((tagId) => +tagId);

            const currentTagsIdsSet = new Set(currentTagsIds);
            const newTagsIdsSet = new Set(newTagsIds);

            const tagIdToRemove = Array.from(
              currentTagsIdsSet.difference(newTagsIdsSet),
            ).at(0);

            const tagIdToAdd = Array.from(
              newTagsIdsSet.difference(currentTagsIdsSet),
            ).at(0);

            if (tagIdToAdd) {
              addTagToTile.mutate({
                data: {
                  tagId: tagIdToAdd,
                  tileId: exercise.data.tile.id,
                },
              });
            }

            if (tagIdToRemove) {
              removeTagToTile.mutate({
                data: {
                  tagId: tagIdToRemove,
                  tileId: exercise.data.tile.id,
                },
              });
            }
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
                <CheckIcon className="mr-1 hidden group-aria-pressed:block" />
                {tag.name}
              </Badge>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        {addTagToTile.error && (
          <Alert variant="destructive" className="m-3 w-auto lg:m-6">
            <AlertCircleIcon />
            <AlertTitle>Heads up!</AlertTitle>
            <AlertDescription>{addTagToTile.error.message}</AlertDescription>
          </Alert>
        )}

        {removeTagToTile.error && (
          <Alert variant="destructive" className="m-3 w-auto lg:m-6">
            <AlertCircleIcon />
            <AlertTitle>Heads up!</AlertTitle>
            <AlertDescription>{removeTagToTile.error.message}</AlertDescription>
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
            Permanently remove this exercise and all of its contents from our
            servers. This action is not reversible, so please continue with
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

const useAddTagToTile = () => {
  const user = useUser();
  const params = Route.useParams();
  const exercise = useExercise(params.exerciseId);

  return useMutation({
    mutationFn: addTagToTileAction,
    onMutate: (variables, ctx) => {
      const queries = {
        exercise: exerciseQueries.get(exercise.data.id).queryKey,
        tiles: dashboardQueries.tiles().queryKey,
        tilesToTagsCount: dashboardQueries.tilesToTagsCount.queryKey,
      };

      const tag = user.data.tags.find((tag) => {
        return tag.id === variables.data.tagId;
      });

      if (!tag) {
        return;
      }

      ctx.client.setQueryData(queries.tiles, (tiles) => {
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
                    tileToTags: [
                      ...tile.tileToTags,
                      {
                        tileId: variables.data.tileId,
                        tagId: tag.id,
                        tag,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                      },
                    ],
                  };
                }

                return tile;
              }),
            };
          }),
        };
      });

      ctx.client.setQueryData(queries.exercise, (exercise) => {
        if (!exercise) {
          return exercise;
        }

        return {
          ...exercise,
          tile: {
            ...exercise.tile,
            tileToTags: [
              ...exercise.tile.tileToTags,
              {
                tileId: variables.data.tileId,
                tagId: tag.id,
                tag,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ],
          },
        };
      });

      ctx.client.setQueryData(queries.tilesToTagsCount, (tilesToTagsCount) => {
        if (!tilesToTagsCount) {
          return tilesToTagsCount;
        }

        return tilesToTagsCount.map((tilesToTagsCount) => {
          if (tilesToTagsCount.id === variables.data.tagId) {
            return {
              ...tilesToTagsCount,
              count: tilesToTagsCount.count + 1,
            };
          }

          return tilesToTagsCount;
        });
      });
    },
    onSettled: (_data, _error, _variables, _res, ctx) => {
      const queries = {
        exercise: exerciseQueries.get(exercise.data.id),
        tiles: dashboardQueries.tiles(),
        tilesToTagsCount: dashboardQueries.tilesToTagsCount,
      } as const;

      void ctx.client.invalidateQueries(queries.tiles);
      void ctx.client.invalidateQueries(queries.exercise);
      void ctx.client.invalidateQueries(queries.tilesToTagsCount);
    },
  });
};

const useRemoveTagToTile = () => {
  const user = useUser();
  const params = Route.useParams();
  const exercise = useExercise(params.exerciseId);

  return useMutation({
    mutationFn: removeTagToTileAction,
    onMutate: (variables, ctx) => {
      const queries = {
        exercise: exerciseQueries.get(exercise.data.id).queryKey,
        tiles: dashboardQueries.tiles().queryKey,
        tilesToTagsCount: dashboardQueries.tilesToTagsCount.queryKey,
      };

      const tag = user.data.tags.find((tag) => {
        return tag.id === variables.data.tagId;
      });

      if (!tag) {
        return;
      }

      ctx.client.setQueryData(queries.tiles, (tiles) => {
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
                    tileToTags: tile.tileToTags.filter((tileToTags) => {
                      return tileToTags.tagId !== variables.data.tagId;
                    }),
                  };
                }

                return tile;
              }),
            };
          }),
        };
      });

      ctx.client.setQueryData(queries.exercise, (exercise) => {
        if (!exercise) {
          return exercise;
        }

        return {
          ...exercise,
          tile: {
            ...exercise.tile,
            tileToTags: exercise.tile.tileToTags.filter((tileToTags) => {
              return tileToTags.tagId !== variables.data.tagId;
            }),
          },
        };
      });

      ctx.client.setQueryData(queries.tilesToTagsCount, (tilesToTagsCount) => {
        if (!tilesToTagsCount) {
          return tilesToTagsCount;
        }

        return tilesToTagsCount.map((tilesToTagsCount) => {
          if (tilesToTagsCount.id === variables.data.tagId) {
            return {
              ...tilesToTagsCount,
              count: tilesToTagsCount.count - 1,
            };
          }

          return tilesToTagsCount;
        });
      });
    },
    onSettled: (_data, _error, _variables, _res, ctx) => {
      const queries = {
        exercise: exerciseQueries.get(exercise.data.id),
        tiles: dashboardQueries.tiles(),
        tilesToTagsCount: dashboardQueries.tilesToTagsCount,
      } as const;

      void ctx.client.invalidateQueries(queries.tiles);
      void ctx.client.invalidateQueries(queries.exercise);
      void ctx.client.invalidateQueries(queries.tilesToTagsCount);
    },
  });
};
