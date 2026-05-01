import type { Set } from "@gym-graphs/shared/set/schemas";
import { ComponentProps, ReactNode, useMemo } from "react";
import { useSetsByDoneAt } from "~/domains/set/hooks/use-sets-by-done-at";
import { Table, TableBody, TableHeader, TableRow } from "~/ui/table";
import { SetProvider } from "~/domains/set/set.context";
import { Badge } from "~/ui/badge";
import { useSortSetsByDoneAt } from "~/domains/set/hooks/use-sort-sets-by-done-at";
import { cn } from "~/styles/styles.utils";
import { useProgressivePrs } from "~/domains/set/hooks/use-progressive-prs";

export type SetRow = Set;

export type ColumnDef<TData> = {
  id: string;
  header: () => ReactNode;
  cell: (row: { data: TData; index: number; isPr: boolean }) => ReactNode;
};

export const createColumnHelper = <TData,>() => ({
  column: (def: ColumnDef<TData>): ColumnDef<TData> => def,
});

export const SetsList = (props: Props) => {
  const sortedSets = useSortSetsByDoneAt(props.sets, "desc");
  const sets = useSetsByDoneAt(sortedSets);

  const progressivePrs = useProgressivePrs(props.sets);

  const progressivePrIds = useMemo(
    () => new Set(progressivePrs.map((pr) => pr.id)),
    [progressivePrs],
  );

  if (!props.sets.length) {
    return <NoDataText>no data</NoDataText>;
  }

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

              {sets.some((set) => progressivePrIds.has(set.id)) && (
                <Badge className="font-semibold uppercase">pr</Badge>
              )}
            </header>
            <Table>
              <TableHeader>
                <TableRow>
                  {props.columns.map((col) => (
                    <col.header key={col.id} />
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sets.map((set, i) => (
                  <SetProvider key={set.id} value={set}>
                    <TableRow
                      className={cn(
                        progressivePrIds.has(set.id) && "font-bold",
                      )}
                    >
                      {props.columns.map((col) =>
                        col.cell({
                          data: set,
                          index: i,
                          isPr: progressivePrIds.has(set.id),
                        }),
                      )}
                    </TableRow>
                  </SetProvider>
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
  sets: ReadonlyArray<Set>;
  columns: ColumnDef<Set>[];
};

const NoDataText = (props: ComponentProps<"p">) => {
  return (
    <p
      className="text-muted-foreground bg-secondary m-auto my-10 rounded-md border p-5 text-center text-sm"
      {...props}
    />
  );
};
