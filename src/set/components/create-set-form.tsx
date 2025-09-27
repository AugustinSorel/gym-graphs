import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import {
  Form,
  FormAlert,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/ui/form";
import { Spinner } from "~/ui/spinner";
import { z } from "zod";
import { Button } from "~/ui/button";
import { createSetAction } from "~/set/set.actions";
import { setSchema } from "~/set/set.schemas";
import { useExercise } from "~/exercise/hooks/use-exercise";
import { getCalendarPositions } from "~/utils/date";
import { exerciseQueries } from "~/exercise/exercise.queries";
import { getRouteApi } from "@tanstack/react-router";
import { dashboardQueries } from "~/dashboard/dashboard.queries";
import { userQueries } from "~/user/user.queries";
import { teamQueries } from "~/team/team.queries";
import { CounterInput } from "~/ui/counter-input";
import { useLastSet } from "~/set/hooks/use-last-set";
import { WeightUnit } from "~/weight-unit/components/weight-unit";

export const CreateSetForm = (props: Props) => {
  const form = useCreateExerciseSetForm();
  const createSet = useCreateSet();
  const params = routeApi.useParams();
  const exercise = useExercise(params.exerciseId);

  const onSubmit = async (data: CreateExerciseSchema) => {
    await createSet.mutateAsync(
      {
        data: {
          exerciseId: exercise.data.id,
          repetitions: data.repetitions,
          weightInKg: data.weightInKg,
        },
      },
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="weightInKg"
          render={() => (
            <FormItem className="flex flex-col gap-1">
              <FormLabel>
                weight (<WeightUnit />
                ):
              </FormLabel>
              <FormControl>
                <CounterInput />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="repetitions"
          render={() => (
            <FormItem className="flex flex-col gap-1">
              <FormLabel>repetitions:</FormLabel>
              <FormControl>
                <CounterInput />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormAlert />

        <footer className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            data-umami-event="exercise set created"
            className="font-semibold"
          >
            <span>add</span>
            {form.formState.isSubmitting && <Spinner />}
          </Button>
        </footer>
      </form>
    </Form>
  );
};

type Props = Readonly<{
  onSuccess?: () => void;
}>;

const routeApi = getRouteApi("/(exercises)/exercises/$exerciseId");

const useFormSchema = () => {
  return z
    .object({
      repetitions: z.coerce.number(),
      weightInKg: z.coerce.number(),
    })
    .pipe(setSchema.pick({ repetitions: true, weightInKg: true }));
};

type CreateExerciseSchema = Readonly<z.infer<ReturnType<typeof useFormSchema>>>;

const useCreateExerciseSetForm = () => {
  const formSchema = useFormSchema();
  const params = routeApi.useParams();
  const exercise = useExercise(params.exerciseId);

  const lastSet = useLastSet(exercise.data.sets);

  return useForm<CreateExerciseSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      repetitions: lastSet?.repetitions ?? 0,
      weightInKg: lastSet?.weightInKg ?? 0,
    },
  });
};

const useCreateSet = () => {
  const params = routeApi.useParams();
  const exercise = useExercise(params.exerciseId);

  return useMutation({
    mutationFn: createSetAction,
    onMutate: (variables, ctx) => {
      const queries = {
        exercise: exerciseQueries.get(exercise.data.id).queryKey,
        tiles: dashboardQueries.tiles().queryKey,
        setsHeatMap: dashboardQueries.tilesSetsHeatMap.queryKey,
        funFacts: dashboardQueries.funFacts.queryKey,
        tilesToSetsCount: dashboardQueries.tilesToSetsCount.queryKey,
      } as const;

      const optimisticExerciseSet = {
        id: Math.random(),
        exerciseId: variables.data.exerciseId,
        weightInKg: variables.data.weightInKg,
        repetitions: variables.data.repetitions,
        createdAt: new Date(),
        doneAt: new Date(),
        updatedAt: new Date(),
      };

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
                if (tile.exercise?.id === variables.data.exerciseId) {
                  return {
                    ...tile,
                    exercise: {
                      ...tile.exercise,
                      sets: [optimisticExerciseSet, ...tile.exercise.sets],
                    },
                  };
                }

                return tile;
              }),
            };
          }),
        };
      });

      ctx.client.setQueryData(queries.tilesToSetsCount, (tilesToSetsCount) => {
        if (!tilesToSetsCount) {
          return tilesToSetsCount;
        }

        return tilesToSetsCount.map((tile) => {
          if (tile.name === exercise.data.tile.name) {
            return {
              ...tile,
              count: tile.count + 1,
            };
          }

          return tile;
        });
      });

      ctx.client.setQueryData(queries.funFacts, (funFacts) => {
        if (!funFacts) {
          return funFacts;
        }

        const exerciseTotalWeightInKg =
          optimisticExerciseSet.weightInKg * optimisticExerciseSet.repetitions;

        return {
          ...funFacts,
          totalRepetitions:
            funFacts.totalRepetitions + variables.data.repetitions,
          totalWeightInKg: funFacts.totalWeightInKg + exerciseTotalWeightInKg,
        };
      });

      ctx.client.setQueryData(queries.setsHeatMap, (setsHeatMap) => {
        if (!setsHeatMap) {
          return setsHeatMap;
        }

        const calendarPositions = getCalendarPositions(
          optimisticExerciseSet.doneAt,
        );

        return setsHeatMap.map((row) => {
          if (row.dayIndex === calendarPositions.day) {
            return {
              ...row,
              bins: row.bins.map((cell) => {
                if (cell.weekIndex === calendarPositions.week) {
                  return {
                    ...cell,
                    count: cell.count + 1,
                  };
                }
                return cell;
              }),
            };
          }

          return row;
        });
      });

      ctx.client.setQueryData(queries.exercise, (exercise) => {
        if (!exercise) {
          return exercise;
        }

        return {
          ...exercise,
          sets: [optimisticExerciseSet, ...exercise.sets],
        };
      });
    },
    onSettled: (_data, _error, _variables, _res, ctx) => {
      const queries = {
        exercise: exerciseQueries.get(exercise.data.id),
        tiles: dashboardQueries.tiles(),
        tilesToSetsCount: dashboardQueries.tilesToSetsCount,
        setsHeatMap: dashboardQueries.tilesSetsHeatMap,
        funFacts: dashboardQueries.funFacts,
        user: userQueries.get,
        userAndPublicTeams: teamQueries.userAndPublicTeams(),
      } as const;

      void ctx.client.invalidateQueries(queries.tiles);
      void ctx.client.invalidateQueries(queries.exercise);
      void ctx.client.invalidateQueries(queries.tilesToSetsCount);
      void ctx.client.invalidateQueries(queries.setsHeatMap);
      void ctx.client.invalidateQueries(queries.funFacts);
      void ctx.client.invalidateQueries(queries.user);
      void ctx.client.invalidateQueries(queries.userAndPublicTeams);
    },
  });
};
