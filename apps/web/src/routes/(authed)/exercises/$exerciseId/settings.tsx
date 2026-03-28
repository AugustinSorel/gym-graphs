import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import {
  CatchBoundary,
  ClientOnly,
  createFileRoute,
  Link,
  // redirect,
  useCanGoBack,
  useRouter,
} from "@tanstack/react-router";
import { AlertCircleIcon, ArrowLeftIcon, CheckIcon } from "~/ui/icons";
// import { z } from "zod";
// import { DeleteExerciseOverviewTileDialog } from "~/domains/tile/components/delete-exercise-overview-tile-dialog";
import { RenameExerciseOverviewTileDialog } from "~/domains/tile/components/rename-exercise-overview-tile-dialog";
import { exerciseQueries } from "~/domains/exercise/exercise.queries";
// import { exerciseSchema } from "@gym-graphs/schemas/exercise";
import { useExercise } from "~/domains/exercise/hooks/use-exercise";
import { cn } from "~/styles/styles.utils";
import { CreateTagDialog } from "~/domains/tag/components/create-tag-dialog";
import { tagQueries } from "~/domains/tag/tag.queries";
import { Alert, AlertDescription, AlertTitle } from "~/ui/alert";
import { Badge } from "~/ui/badge";
import { Button } from "~/ui/button";
import { Separator } from "~/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "~/ui/toggle-group";
// import { useUser } from "~/domains/user/hooks/use-user";
import type { ComponentProps } from "react";
import { callApi, InferApiProps } from "~/libs/api";
import { DefaultFallback } from "~/ui/fallback";
import { tileQueries } from "~/domains/tile/tile.queries";

export const Route = createFileRoute(
  "/(authed)/exercises/$exerciseId/settings",
)({
  component: () => RouteComponent(),
  loader: async ({ context, params }) => {
    const queries = {
      exercise: exerciseQueries.get(params.exerciseId),
    } as const;

    await context.queryClient.ensureQueryData(queries.exercise);
  },
});

const RouteComponent = () => {
  const params = Route.useParams();
  const exercise = useSuspenseQuery(exerciseQueries.get(params.exerciseId));

  return (
    <Main>
      <Header>
        <Title>{exercise.data.name} settings</Title>
        <ClientOnly>
          <BackBtn />
        </ClientOnly>
      </Header>

      <Separator />

      <RenameTileSection />
      <ExerciseTagsSection />
      {/*<DeleteTileSection /> */}
    </Main>
  );
};

const RenameTileSection = () => {
  return (
    <CatchBoundary errorComponent={DefaultFallback} getResetKey={() => "reset"}>
      <Section>
        <HGroup>
          <SectionTitle>rename exercise</SectionTitle>
          <SectionDescription>
            Feel free to rename this exercise to somehting more comfortable.
            Your exercises name are not public.
          </SectionDescription>
        </HGroup>
        <Footer>
          <RenameExerciseOverviewTileDialog />
        </Footer>
      </Section>
    </CatchBoundary>
  );
};

const ExerciseTagsSection = () => {
  const params = Route.useParams();
  const exercise = useSuspenseQuery(exerciseQueries.get(params.exerciseId));

  const tags = useSuspenseQuery(tagQueries.all);
  const tileTags = useSuspenseQuery(tileQueries.tags(exercise.data.tileId));

  const addTagToTile = useAddTagToTile();
  const removeTagToTile = useRemoveTagToTile();

  return (
    <CatchBoundary errorComponent={DefaultFallback} getResetKey={() => "reset"}>
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
          value={tileTags.data.map((tag) => tag.id.toString())}
          onValueChange={(newTagsIdsStr) => {
            const currentTagsIds = tileTags.data.map((tag) => tag.id);
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
                path: {
                  tileId: exercise.data.tileId,
                },
                payload: {
                  tagId: tagIdToAdd,
                },
              });
            }

            if (tagIdToRemove) {
              removeTagToTile.mutate({
                path: {
                  tileId: exercise.data.tileId,
                  tagId: tagIdToRemove,
                },
              });
            }
          }}
        >
          {!tags.data.length && <NoTagsText>no tags</NoTagsText>}
          {tags.data.map((tag) => (
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

/*const DeleteTileSection = () => {
  return (
    <CatchBoundary errorComponent={DefaultFallback} getResetKey={() => "reset"}>
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
    </CatchBoundary>
  );
};
*/

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
  const params = Route.useParams();
  const exercise = useExercise(Number(params.exerciseId));

  const queries = {
    exercise: exerciseQueries.get(exercise.data.id),
    tileTags: tileQueries.tags(exercise.data.tileId),
    allTags: tagQueries.all,
  };

  return useMutation({
    mutationFn: async (props: InferApiProps<"DashboardTile", "addTag">) => {
      return callApi((api) => api.DashboardTile.addTag(props));
    },
    onMutate: async (variables, ctx) => {
      await ctx.client.cancelQueries(queries.tileTags);

      const oldTileTags = ctx.client.getQueryData(queries.tileTags.queryKey);

      const allTags = ctx.client.getQueryData(queries.allTags.queryKey);
      const tag = allTags?.find((t) => t.id === variables.payload.tagId);

      if (tag) {
        ctx.client.setQueryData(queries.tileTags.queryKey, (tileTags) => {
          if (!tileTags) return tileTags;
          return [...tileTags, { id: tag.id, name: tag.name }];
        });
      }

      return { oldTileTags };
    },
    onError: (_e, _variables, onMutateRes, ctx) => {
      ctx.client.setQueryData(
        queries.tileTags.queryKey,
        onMutateRes?.oldTileTags,
      );
    },
    onSettled: (_data, _error, _variables, _res, ctx) => {
      void ctx.client.invalidateQueries(queries.tileTags);
      void ctx.client.invalidateQueries(queries.exercise);
    },
  });
};

const useRemoveTagToTile = () => {
  const params = Route.useParams();
  const exercise = useExercise(Number(params.exerciseId));

  const queries = {
    exercise: exerciseQueries.get(exercise.data.id),
    tileTags: tileQueries.tags(exercise.data.tileId),
  };

  return useMutation({
    mutationFn: async (props: InferApiProps<"DashboardTile", "removeTag">) => {
      return callApi((api) => api.DashboardTile.removeTag(props));
    },
    onMutate: async (variables, ctx) => {
      await ctx.client.cancelQueries(queries.tileTags);

      const oldTileTags = ctx.client.getQueryData(queries.tileTags.queryKey);

      ctx.client.setQueryData(queries.tileTags.queryKey, (tileTags) => {
        if (!tileTags) return tileTags;
        return tileTags.filter((t) => t.id !== variables.path.tagId);
      });

      return { oldTileTags };
    },
    onError: (_e, _variables, onMutateRes, ctx) => {
      ctx.client.setQueryData(
        queries.tileTags.queryKey,
        onMutateRes?.oldTileTags,
      );
    },
    onSettled: (_data, _error, _variables, _res, ctx) => {
      void ctx.client.invalidateQueries(queries.tileTags);
      void ctx.client.invalidateQueries(queries.exercise);
    },
  });
};

const BackBtn = () => {
  const canGoBack = useCanGoBack();
  const router = useRouter();

  if (canGoBack) {
    return (
      <Button
        variant="link"
        className="text-muted-foreground mr-auto p-0"
        onClick={() => router.history.back()}
      >
        <ArrowLeftIcon />
        <span>back</span>
      </Button>
    );
  }

  return (
    <Button
      asChild
      variant="link"
      className="text-muted-foreground mr-auto p-0"
    >
      <Link to="/dashboard">
        <ArrowLeftIcon />
        <span>back</span>
      </Link>
    </Button>
  );
};
