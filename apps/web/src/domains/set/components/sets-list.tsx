import type { SelectSetsSuccess } from "@gym-graphs/shared/set/schemas";
import { ComponentProps } from "react";
import { useSetsByDoneAt } from "~/domains/set/hooks/use-sets-by-done-at";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/ui/dropdown-menu";
import { SetProvider } from "~/domains/set/set.context";
import { UpdateSetWeightDialog } from "~/domains/set/components/update-set-weight-dialog";
import { UpdateSetRepetitionsDialog } from "~/domains/set/components/update-set-repetitions-dialog";
import { UpdateSetDoneAtDialog } from "~/domains/set/components/update-set-done-at-dialog";
import { DeleteSetDialog } from "~/domains/set/components/delete-set-dialog";
import { EllipsisIcon, StarIcon } from "~/ui/icons";
import { Button } from "~/ui/button";
import { WeightValue } from "~/domains/user/components/weight-value";
import { WeightUnit } from "~/domains/user/components/weight-unit";
import {
  calculateOneRepMax,
  calculateVolume,
  exceedsOneRepMax,
} from "~/domains/set/set.utils";
import { useSuspenseQuery } from "@tanstack/react-query";
import { userQueries } from "~/domains/user/user.queries";
import { Badge } from "~/ui/badge";
import { Mutable } from "effect/Types";
import { useSortSetsByDoneAt } from "~/domains/set/hooks/use-sort-sets-by-done-at";
import { cn } from "~/styles/styles.utils";

export const SetsList = (props: Props) => {
  const sortedSets = useSortSetsByDoneAt(props.sets, "desc");
  const sets = useSetsByDoneAt(sortedSets);
  const user = useSuspenseQuery(userQueries.get);

  if (!props.sets.length) {
    return <NoDataText>no data</NoDataText>;
  }

  const progressivePrs = new Set(
    getProgressivePrs(props.sets).flatMap((pr) => pr.id),
  );

  return (
    <ol className="space-y-3">
      {Array.from(sets).map(([doneAt, sets]) => {
        if (!sets.length) {
          return <NoDataText>no data</NoDataText>;
        }

        return (
          <li
            key={doneAt}
            className="bg-secondary relative grid rounded-md border p-5"
          >
            <header className="mt-3 mb-6 flex justify-between">
              <time dateTime={doneAt}>
                <span className="text-xl first-letter:uppercase">
                  {new Date(doneAt).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </span>{" "}
                <span className="text-muted-foreground text-sm">
                  {new Date(doneAt).toLocaleDateString("en-US", {
                    year: "numeric",
                  })}
                </span>
              </time>

              {sets.some((set) => progressivePrs.has(set.id)) && (
                <Badge className="font-semibold uppercase">pr</Badge>
              )}
            </header>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-muted-foreground w-[min(100px,auto)]">
                    #
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    Weight
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    <abbr title="repetitions" className="no-underline">
                      Reps
                    </abbr>
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    <abbr title="1 rep max" className="no-underline">
                      1RM
                    </abbr>
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    Volume
                  </TableHead>
                  <TableHead className="text-muted-foreground text-right">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sets.map((set, i) => (
                  <TableRow
                    key={set.id}
                    className={cn(progressivePrs.has(set.id) && "font-bold")}
                  >
                    <TableCell className="">
                      {progressivePrs.has(set.id) && (
                        <StarIcon className="-mt-1 mr-1 inline-flex fill-current stroke-none" />
                      )}
                      {i + 1}
                    </TableCell>
                    <TableCell>
                      <WeightValue weightInKg={set.weightInKg} />{" "}
                      <span className="text-muted-foreground text-sm font-normal">
                        <WeightUnit />
                      </span>
                    </TableCell>
                    <TableCell>{set.repetitions}</TableCell>
                    <TableCell>
                      <WeightValue
                        weightInKg={calculateOneRepMax(
                          set.weightInKg,
                          set.repetitions,
                          user.data.oneRepMaxAlgo,
                        )}
                      />{" "}
                      <span className="text-muted-foreground text-sm font-normal">
                        <WeightUnit />
                      </span>
                    </TableCell>
                    <TableCell>
                      <WeightValue
                        weightInKg={calculateVolume(
                          set.weightInKg,
                          set.repetitions,
                        )}
                      />{" "}
                      <span className="text-muted-foreground text-sm font-normal">
                        <WeightUnit />
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <EllipsisIcon />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <SetProvider value={set}>
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <UpdateSetWeightDialog />
                            <UpdateSetRepetitionsDialog />
                            <UpdateSetDoneAtDialog />
                            <DropdownMenuSeparator />
                            <DeleteSetDialog />
                          </SetProvider>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </li>
        );
      })}
    </ol>
  );
};

type Props = {
  sets: typeof SelectSetsSuccess.Type;
};

const NoDataText = (props: ComponentProps<"p">) => {
  return (
    <p
      className="text-muted-foreground bg-secondary m-auto my-10 rounded-md border p-5 text-center text-sm"
      {...props}
    />
  );
};

const getProgressivePrs = (sets: typeof SelectSetsSuccess.Type) => {
  return sets.reduce<Mutable<typeof SelectSetsSuccess.Type>>(
    (progressivePrs, candidateSet) => {
      const currentPr = progressivePrs.at(-1);

      if (!currentPr) {
        progressivePrs.push(candidateSet);
        return progressivePrs;
      }

      const newPr = exceedsOneRepMax(currentPr, candidateSet);

      if (newPr) {
        progressivePrs.push(candidateSet);
      }

      return progressivePrs;
    },
    [],
  );
};
