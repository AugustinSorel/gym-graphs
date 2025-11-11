import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { Spinner } from "~/ui/spinner";
import { Input } from "~/ui/input";
import { Button } from "~/ui/button";
import { api } from "~/libs/api";
import { parseJsonResponse } from "@gym-graphs/api";
import { tileQueries } from "~/domains/tile/tile.queries";
import { useUser } from "~/domains/user/hooks/use-user";
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
import { createExerciseTileSchema } from "@gym-graphs/schemas/tile";
import type { CreateExerciseTile } from "@gym-graphs/schemas/tile";
import type { InferApiReqInput } from "@gym-graphs/api";

export const CreateExerciseOverviewTileForm = (props: Props) => {
  const form = useCreateExerciseTileForm();
  const createExerciseTile = useCreateExerciseTile();

  const onSubmit = async (data: CreateExerciseTile) => {
    await createExerciseTile.mutateAsync(
      { json: data },
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

  return createExerciseTileSchema.refine(
    (data) => {
      const queries = {
        tiles: tileQueries.all().queryKey,
      };

      const cachedTiles = queryClient.getQueryData(queries.tiles);

      const nameTaken = cachedTiles?.pages
        .flatMap((page) => page.tiles)
        .find((tile) => {
          return tile.name === data.name;
        });

      return !nameTaken;
    },
    {
      message: "exercise already created",
      path: ["name"],
    },
  );
};

const useCreateExerciseTileForm = () => {
  const formSchema = useFormSchema();

  return useForm<CreateExerciseTile>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      tagIds: null,
    },
  });
};

const useCreateExerciseTile = () => {
  const user = useUser();
  const req = api().tiles["exercise-tile"].$post;

  const queries = {
    tiles: tileQueries.all(),
  };

  return useMutation({
    mutationFn: async (input: InferApiReqInput<typeof req>) => {
      return parseJsonResponse(req(input));
    },
    onMutate: async (variables, ctx) => {
      await ctx.client.cancelQueries(queries.tiles);

      const oldTiles = ctx.client.getQueryData(queries.tiles.queryKey);

      const exerciseId = Math.random();
      const tileId = Math.random();

      const optimisticTile = {
        id: tileId,
        index: 1_0000,
        type: "exerciseOverview" as const,
        dashboardId: user.data.dashboard.id,
        name: variables.json.name,
        tileToTags:
          variables.json.tagIds?.map((tagId) => {
            const tag = user.data.tags.find((tag) => tag.id === tagId);

            if (!tag) {
              throw new Error(`user does not have a tag with id ${tagId}`);
            }

            return {
              tagId,
              tileId,
              tag,
              createdAt: new Date().toString(),
              updatedAt: new Date().toString(),
            };
          }) ?? [],
        dashboardFunFacts: null,
        dashboardHeatMap: null,
        exerciseSetCount: null,
        exerciseTagCount: null,
        exerciseOverview: {
          exercise: {
            id: exerciseId,
            userId: user.data.id,
            sets: [],
            createdAt: new Date().toString(),
            updatedAt: new Date().toString(),
          },
          id: Math.random(),
          exerciseId,
          tileId,
          createdAt: new Date().toString(),
          updatedAt: new Date().toString(),
        },

        createdAt: new Date().toString(),
        updatedAt: new Date().toString(),
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
                tiles: [optimisticTile, ...page.tiles],
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
    ComponentProps<typeof Controller<CreateExerciseTile, "tagIds">>["render"]
  >[0],
) => {
  const user = useUser();
  const tags = user.data.tags;

  if (!tags.length) {
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
