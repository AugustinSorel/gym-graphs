import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { AlertCircleIcon, ArrowLeftIcon, CheckIcon } from "~/ui/icons";
import { z } from "zod";
import { DeleteExerciseOverviewTileDialog } from "~/domains/tile/components/delete-exercise-overview-tile-dialog";
import { RenameExerciseOverviewTileDialog } from "~/domains/tile/components/rename-exercise-overview-tile-dialog";
import { exerciseQueries } from "~/domains/exercise/exercise.queries";
import { exerciseSchema } from "@gym-graphs/schemas/exercise";
import { useExercise } from "~/domains/exercise/hooks/use-exercise";
import { cn } from "~/styles/styles.utils";
import { CreateTagDialog } from "~/domains/tag/components/create-tag-dialog";
import { Alert, AlertDescription, AlertTitle } from "~/ui/alert";
import { Badge } from "~/ui/badge";
import { Button } from "~/ui/button";
import { Separator } from "~/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "~/ui/toggle-group";
import { useUser } from "~/domains/user/hooks/use-user";
import { tileQueries } from "~/domains/tile/tile.queries";
import { api, parseJsonResponse } from "~/libs/api";
import type { ComponentProps } from "react";
import type { InferRequestType } from "hono";

export const Route = createFileRoute(
  "/(exercises)/exercises_/$exerciseId/settings",
)({
  params: z.object({
    exerciseId: z.coerce.number().pipe(exerciseSchema.shape.id),
  }),
  component: () => RouteComponent(),
  beforeLoad: async ({ context }) => {
    if (!context.user?.emailVerifiedAt) {
      throw redirect({ to: "/sign-in" });
    }
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
        <Title>{exercise.data.exerciseOverviewTile.tile.name} settings</Title>
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
    <Section>
      <HGroup>
        <SectionTitle>rename exercise</SectionTitle>
        <SectionDescription>
          Feel free to rename this exercise to somehting more comfortable. Your
          exercises name are not public.
        </SectionDescription>
      </HGroup>
      <Footer>
        <RenameExerciseOverviewTileDialog />
      </Footer>
    </Section>
  );
};

const ExerciseTagsSection = () => {
  const user = useUser();
  const params = Route.useParams();
  const exercise = useExercise(params.exerciseId);

  const addTagToTile = useAddTagToTile();
  const removeTagToTile = useRemoveTagToTile();

  return (
    <Section>
      <HGroup>
        <SectionTitle>exercise tags</SectionTitle>
        <SectionDescription>
          Feel free to rename this exercise to somehting more comfortable. Your
          exercises name are not public.
        </SectionDescription>
      </HGroup>

      <ToggleGroup
        className="m-3 mt-0 flex flex-wrap justify-start gap-1 rounded-md border p-1 lg:m-6 lg:gap-4 lg:p-4"
        type="multiple"
        value={exercise.data.exerciseOverviewTile.tile.tileToTags.map(
          (tileToTag) => {
            return tileToTag.tag.id.toString();
          },
        )}
        onValueChange={(newTagsIdsStr) => {
          const currentTagsIds =
            exercise.data.exerciseOverviewTile.tile.tileToTags.map(
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
              param: {
                tileId: exercise.data.exerciseOverviewTile.tile.id.toString(),
              },
              json: {
                tagId: tagIdToAdd,
              },
            });
          }

          if (tagIdToRemove) {
            removeTagToTile.mutate({
              param: {
                tileId: exercise.data.exerciseOverviewTile.tile.id.toString(),
              },
              json: {
                tagId: tagIdToRemove,
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
  );
};

const DeleteTileSection = () => {
  return (
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
        <DeleteExerciseOverviewTileDialog />
      </Footer>
    </Section>
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
  const req = api().tiles[":tileId"].tags.$post;

  const queries = {
    exercise: exerciseQueries.get(exercise.data.id),
    tiles: tileQueries.all(),
  };

  return useMutation({
    mutationFn: async (input: InferRequestType<typeof req>) => {
      return parseJsonResponse(req(input));
    },
    onMutate: async (variables, ctx) => {
      await ctx.client.cancelQueries(queries.tiles);
      await ctx.client.cancelQueries(queries.exercise);

      const oldTiles = ctx.client.getQueryData(queries.tiles.queryKey);
      const oldExercise = ctx.client.getQueryData(queries.exercise.queryKey);

      ctx.client.setQueryData(queries.tiles.queryKey, (tiles) => {
        const tag = user.data.tags.find((tag) => {
          return tag.id === variables.json.tagId;
        });

        if (!tiles || !tag) {
          return tiles;
        }

        return {
          ...tiles,
          pages: tiles.pages.map((page) => {
            return {
              ...page,
              tiles: page.tiles.map((tile) => {
                if (tile.id.toString() === variables.param.tileId) {
                  return {
                    ...tile,
                    tileToTags: [
                      ...tile.tileToTags,
                      {
                        tileId: +variables.param.tileId,
                        tagId: tag.id,
                        tag,
                        createdAt: new Date().toString(),
                        updatedAt: new Date().toString(),
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

      ctx.client.setQueryData(queries.exercise.queryKey, (exercise) => {
        const tag = user.data.tags.find((tag) => {
          return tag.id === variables.json.tagId;
        });

        if (!exercise || !tag) {
          return exercise;
        }

        return {
          ...exercise,
          exerciseOverviewTile: {
            ...exercise.exerciseOverviewTile,
            tile: {
              ...exercise.exerciseOverviewTile.tile,
              tileToTags: [
                ...exercise.exerciseOverviewTile.tile.tileToTags,
                {
                  tileId: +variables.param.tileId,
                  tagId: tag.id,
                  tag,
                  createdAt: new Date().toString(),
                  updatedAt: new Date().toString(),
                },
              ],
            },
          },
        };
      });

      return {
        oldTiles,
        oldExercise,
      };
    },
    onError: (_e, _variables, onMutateRes, ctx) => {
      ctx.client.setQueryData(queries.tiles.queryKey, onMutateRes?.oldTiles);
      ctx.client.setQueryData(
        queries.exercise.queryKey,
        onMutateRes?.oldExercise,
      );
    },
    onSettled: (_data, _error, _variables, _res, ctx) => {
      void ctx.client.invalidateQueries(queries.tiles);
      void ctx.client.invalidateQueries(queries.exercise);
    },
  });
};

const useRemoveTagToTile = () => {
  const user = useUser();
  const params = Route.useParams();
  const exercise = useExercise(params.exerciseId);
  const req = api().tiles[":tileId"].tags.$delete;

  const queries = {
    exercise: exerciseQueries.get(exercise.data.id),
    tiles: tileQueries.all(),
  };

  return useMutation({
    mutationFn: async (input: InferRequestType<typeof req>) => {
      return parseJsonResponse(req(input));
    },
    onMutate: async (variables, ctx) => {
      await ctx.client.cancelQueries(queries.exercise);
      await ctx.client.cancelQueries(queries.tiles);

      const oldTiles = ctx.client.getQueryData(queries.tiles.queryKey);
      const oldExercise = ctx.client.getQueryData(queries.exercise.queryKey);

      ctx.client.setQueryData(queries.tiles.queryKey, (tiles) => {
        const tag = user.data.tags.find((tag) => {
          return tag.id === variables.json.tagId;
        });

        if (!tiles || !tag) {
          return tiles;
        }

        return {
          ...tiles,
          pages: tiles.pages.map((page) => {
            return {
              ...page,
              tiles: page.tiles.map((tile) => {
                if (tile.id.toString() === variables.param.tileId) {
                  return {
                    ...tile,
                    tileToTags: tile.tileToTags.filter((tileToTags) => {
                      return tileToTags.tagId !== variables.json.tagId;
                    }),
                  };
                }

                return tile;
              }),
            };
          }),
        };
      });

      ctx.client.setQueryData(queries.exercise.queryKey, (exercise) => {
        if (!exercise) {
          return exercise;
        }

        return {
          ...exercise,
          exerciseOverviewTile: {
            ...exercise.exerciseOverviewTile,
            tile: {
              ...exercise.exerciseOverviewTile.tile,
              tileToTags: exercise.exerciseOverviewTile.tile.tileToTags.filter(
                (tileToTags) => {
                  return tileToTags.tagId !== variables.json.tagId;
                },
              ),
            },
          },
        };
      });

      return {
        oldTiles,
        oldExercise,
      };
    },
    onError: (_e, _variables, onMutateRes, ctx) => {
      ctx.client.setQueryData(queries.tiles.queryKey, onMutateRes?.oldTiles);
      ctx.client.setQueryData(
        queries.exercise.queryKey,
        onMutateRes?.oldExercise,
      );
    },
    onSettled: (_data, _error, _variables, _res, ctx) => {
      void ctx.client.invalidateQueries(queries.tiles);
      void ctx.client.invalidateQueries(queries.exercise);
    },
  });
};
