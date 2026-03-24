import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { Spinner } from "~/ui/spinner";
import { Input } from "~/ui/input";
import { Button } from "~/ui/button";
import { callApi, InferApiProps } from "~/libs/api";
import { tileQueries } from "~/domains/tile/tile.queries";
import { Field, FieldError, FieldGroup, FieldLabel } from "~/ui/field";
import { Alert, AlertDescription, AlertTitle } from "~/ui/alert";
import { AlertCircleIcon, CheckIcon, ChevronsUpDownIcon } from "~/ui/icons";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/ui/collapsible";
import { ToggleGroup, ToggleGroupItem } from "~/ui/toggle-group";
import { ComponentProps } from "react";
import { Badge } from "~/ui/badge";
import { tagQueries } from "~/domains/tag/tag.queries";
import { CreateDashboardTilePayload } from "@gym-graphs/shared/dashboard-tile/schemas";
import { Schema } from "effect";
import { effectTsResolver } from "@hookform/resolvers/effect-ts";

export const CreateExerciseOverviewTileForm = (props: Props) => {
  const form = useCreateExerciseTileForm();
  const createExerciseTile = useCreateExerciseTile();

  const onSubmit = async (payload: typeof CreateDashboardTilePayload.Type) => {
    await createExerciseTile.mutateAsync(
      { payload },
      {
        onSuccess: () => {
          if (props.onSuccess) {
            props.onSuccess();
          }
        },
        onError: (error) => {
          form.setError("root", { message: error.message });
        },
      },
    );
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      <FieldGroup>
        <Controller
          control={form.control}
          name="name"
          render={(props) => (
            <Field data-invalid={props.fieldState.invalid}>
              <FieldLabel htmlFor={props.field.name}>Name:</FieldLabel>
              <Input
                id={props.field.name}
                placeholder="Bench press..."
                aria-invalid={props.fieldState.invalid}
                autoFocus
                {...props.field}
              />
              {props.fieldState.invalid && (
                <FieldError errors={[props.fieldState.error]} />
              )}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="tagIds"
          render={ExerciseTags}
        />

        {form.formState.errors.root?.message && (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>Heads up!</AlertTitle>
            <AlertDescription>
              {form.formState.errors.root.message}
            </AlertDescription>
          </Alert>
        )}

        <footer className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="font-semibold"
            data-umami-event="exercise created"
          >
            <span>create</span>
            {form.formState.isSubmitting && <Spinner />}
          </Button>
        </footer>
      </FieldGroup>
    </form>
  );
};

type Props = Readonly<{
  onSuccess?: () => void;
}>;

const useFormSchema = () => {
  const queryClient = useQueryClient();

  return CreateDashboardTilePayload.pipe(
    Schema.filter((data) => {
      const queries = {
        tiles: tileQueries.all().queryKey,
      };

      const cachedTiles = queryClient.getQueryData(queries.tiles);

      const nameTaken = cachedTiles?.pages
        .flatMap((page) => page.dashboardTiles)
        .find((tile) => {
          return tile.name === data.name;
        });

      if (nameTaken) {
        return {
          message: "exercise already created",
          path: ["name"],
        };
      }

      return undefined;
    }),
  );
};

const useCreateExerciseTileForm = () => {
  const formSchema = useFormSchema();

  return useForm<typeof CreateDashboardTilePayload.Type>({
    resolver: effectTsResolver(formSchema),
    defaultValues: {
      name: "",
      type: "exercise",
      tagIds: [],
    },
  });
};

const useCreateExerciseTile = () => {
  // const user = useUser();

  const queries = {
    tiles: tileQueries.all(),
  };

  return useMutation({
    mutationFn: async (props: InferApiProps<"DashboardTile", "create">) => {
      return callApi((api) => api.DashboardTile.create(props));
    },
    onMutate: async (variables, ctx) => {
      await ctx.client.cancelQueries(queries.tiles);

      const oldTiles = ctx.client.getQueryData(queries.tiles.queryKey);

      // const optimisticTile = {
      //   id: tileId,
      //   index: 1_0000,
      //   type: "exerciseOverview" as const,
      //   name: variables.payload.name,
      //   tileToTags:
      //     variables.payload.tagIds.map((tagId) => {
      //       const tag = user.data.tags.find((tag) => tag.id === tagId);

      //       if (!tag) {
      //         throw new Error(`user does not have a tag with id ${tagId}`);
      //       }

      //       return {
      //         tagId,
      //         tileId,
      //         tag,
      //         createdAt: new Date().toString(),
      //         updatedAt: new Date().toString(),
      //       };
      //     }) ?? [],
      //   dashboardFunFacts: null,
      //   dashboardHeatMap: null,
      //   exerciseSetCount: null,
      //   exerciseTagCount: null,
      //   exerciseOverview: {
      //     exercise: {
      //       id: exerciseId,
      //       userId: user.data.id,
      //       sets: [],
      //       createdAt: new Date().toString(),
      //       updatedAt: new Date().toString(),
      //     },
      //     id: Math.random(),
      //     exerciseId,
      //     tileId,
      //     createdAt: new Date().toString(),
      //     updatedAt: new Date().toString(),
      //   },

      //   createdAt: new Date().toString(),
      //   updatedAt: new Date().toString(),
      // };

      const optimisticTile = {
        id: Math.random(),
        index: 1_0000,
        type: "exercise" as const,
        name: variables.payload.name,
      };

      ctx.client.setQueryData(queries.tiles.queryKey, (tiles) => {
        if (!tiles) {
          return tiles;
        }

        return {
          ...tiles,
          pages: tiles.pages.map((page, i) => {
            if (i === 0) {
              return {
                ...page,
                dashboardTiles: [optimisticTile, ...page.dashboardTiles],
              };
            }

            return page;
          }),
        };
      });

      return {
        oldTiles,
      };
    },
    onError: (_e, _variables, onMutateRes, ctx) => {
      ctx.client.setQueryData(queries.tiles.queryKey, onMutateRes?.oldTiles);
    },
    onSettled: (_data, _error, _variables, _res, ctx) => {
      void ctx.client.invalidateQueries(queries.tiles);
    },
  });
};

const ExerciseTags = (
  props: Parameters<
    ComponentProps<
      typeof Controller<typeof CreateDashboardTilePayload.Type, "tagIds">
    >["render"]
  >[0],
) => {
  const tags = useSuspenseQuery(tagQueries.all);

  if (!tags.data.length) {
    return <></>;
  }

  return (
    <Collapsible>
      <CollapsibleTrigger className="text-muted-foreground flex cursor-pointer items-center gap-1 text-sm hover:underline">
        Include tags
        <ChevronsUpDownIcon />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <Field data-invalid={props.fieldState.invalid}>
          <ToggleGroup
            className="mt-3 flex flex-wrap justify-start gap-1 rounded-md border p-1"
            type="multiple"
            value={props.field.value?.map((id) => id.toString()) ?? []}
            onValueChange={(ids) => {
              props.field.onChange(ids.map((id) => +id));
            }}
          >
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
          {props.fieldState.invalid && (
            <FieldError
              errors={props.fieldState.error as unknown as Array<Error>}
            />
          )}
        </Field>
      </CollapsibleContent>
    </Collapsible>
  );
};
