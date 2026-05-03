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
import { EllipsisIcon } from "~/ui/icons";
import { Button } from "~/ui/button";
import { WeightValue } from "~/domains/user/components/weight-value";
import { WeightUnit } from "~/domains/user/components/weight-unit";
import { calculateOneRepMax, calculateVolume } from "~/domains/set/set.utils";
import { useSuspenseQuery } from "@tanstack/react-query";
import { userQueries } from "~/domains/user/user.queries";
import { TableCell, TableHead } from "~/ui/table";
import { createColumnHelper } from "~/domains/set/components/sets-list";
import type { SetRow } from "~/domains/set/components/sets-list";

const columnHelper = createColumnHelper<SetRow>();

export const indexColumn = columnHelper.column({
  id: "index",
  header: () => (
    <TableHead className="text-muted-foreground w-[min(100px,auto)]">
      #
    </TableHead>
  ),
  cell: ({ index, isPr }) => (
    <TableCell key="index">
      {isPr && (
        <span
          aria-hidden
          className="bg-primary mr-1.5 mb-0.25 inline-flex size-2 rounded-full"
        />
      )}
      {index + 1}
    </TableCell>
  ),
});

export const weightColumn = columnHelper.column({
  id: "weight",
  header: () => <TableHead className="text-muted-foreground">Weight</TableHead>,
  cell: ({ data }) => (
    <TableCell key="weight">
      <WeightValue weightInMg={data.weightInMg} />{" "}
      <span className="text-muted-foreground text-sm font-normal">
        <WeightUnit />
      </span>
    </TableCell>
  ),
});

export const repsColumn = columnHelper.column({
  id: "reps",
  header: () => (
    <TableHead className="text-muted-foreground">
      <abbr title="repetitions" className="no-underline">
        Reps
      </abbr>
    </TableHead>
  ),
  cell: ({ data }) => <TableCell key="reps">{data.repetitions}</TableCell>,
});

const OneRmCell = ({ data }: { data: SetRow }) => {
  const user = useSuspenseQuery(userQueries.get);

  const oneRepMax = calculateOneRepMax(
    data.weightInMg,
    data.repetitions,
    user.data.oneRepMaxAlgo,
  );

  return (
    <TableCell key="1rm">
      <WeightValue weightInMg={oneRepMax} />{" "}
      <span className="text-muted-foreground text-sm font-normal">
        <WeightUnit />
      </span>
    </TableCell>
  );
};

export const oneRmColumn = columnHelper.column({
  id: "1rm",
  header: () => (
    <TableHead className="text-muted-foreground">
      <abbr title="1 rep max" className="no-underline">
        1RM
      </abbr>
    </TableHead>
  ),
  cell: ({ data }) => <OneRmCell key="1rm" data={data} />,
});

export const volumeColumn = columnHelper.column({
  id: "volume",
  header: () => <TableHead className="text-muted-foreground">Volume</TableHead>,
  cell: ({ data }) => (
    <TableCell key="volume">
      <WeightValue
        weightInMg={calculateVolume(data.weightInMg, data.repetitions)}
      />{" "}
      <span className="text-muted-foreground text-sm font-normal">
        <WeightUnit />
      </span>
    </TableCell>
  ),
});

const ActionsCell = ({ data }: { data: SetRow }) => (
  <TableCell key="actions" className="text-right">
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <EllipsisIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto">
        <SetProvider value={data}>
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
);

export const actionsColumn = columnHelper.column({
  id: "actions",
  header: () => (
    <TableHead className="text-muted-foreground text-right">Action</TableHead>
  ),
  cell: ({ data }) => <ActionsCell key="actions" data={data} />,
});

export const defaultColumns = [
  indexColumn,
  weightColumn,
  repsColumn,
  oneRmColumn,
  volumeColumn,
  actionsColumn,
];
