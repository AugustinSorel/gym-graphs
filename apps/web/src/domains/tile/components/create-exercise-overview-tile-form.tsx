import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { Spinner } from "~/ui/spinner";
import { Input } from "~/ui/input";
import { Button } from "~/ui/button";
import { tileSchema } from "@gym-graphs/schemas/tile";
import { api } from "~/libs/api";
import { parseJsonResponse } from "@gym-graphs/api";
import { tileQueries } from "~/domains/tile/tile.queries";
import { useUser } from "~/domains/user/hooks/use-user";
import { Field, FieldError, FieldGroup, FieldLabel } from "~/ui/field";
import { Alert, AlertDescription, AlertTitle } from "~/ui/alert";
import { AlertCircleIcon } from "~/ui/icons";
import type { z } from "zod";
import type { InferApiReqInput } from "@gym-graphs/api";

export const CreateExerciseOverviewTileForm = (props: Props) => {
  const form = useCreateExerciseForm();
  const createExerciseTile = useCreateExerciseTile();

  const onSubmit = async (data: CreateExerciseSchema) => {
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
              <FieldLabel>Name:</FieldLabel>
              <Input
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

  return tileSchema.pick({ name: true }).refine(
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

type CreateExerciseSchema = Readonly<z.infer<ReturnType<typeof useFormSchema>>>;

const useCreateExerciseForm = () => {
  const formSchema = useFormSchema();

  return useForm<CreateExerciseSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });
};

const useCreateExerciseTile = () => {
  const user = useUser();
  const req = api().tiles.$post;

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
        tileToTags: [],
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
