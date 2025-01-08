import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/ui/table";
import { ExerciseSet } from "~/db/db.schemas";
import { getOneRepMaxEplay } from "~/exercise-set/exercise-set.utils";
import {
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "~/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/ui/dropdown-menu";
import { useState } from "react";
import { UpdateExerciseSetWeightDialog } from "~/exercise-set/components/update-exercise-set-weight-dialog";
import { ExerciseSetProvider } from "~/exercise-set/exercise-set.context";
import { UpdateExerciseSetRepetitionsDialog } from "~/exercise-set/components/update-exercise-set-repetitions-dialog";
import { DeleteExerciseSetDialog } from "~/exercise-set/components/delete-exercise-set-dialog";
import { UpdateExerciseSetDoneAtDialog } from "~/exercise-set/components/update-exercise-set-done-at-dialog";
import { WeightUnit } from "~/weight-unit/components/weight-unit";
import { WeightValue } from "~/weight-unit/components/weight-value";

type Props = Readonly<{
  sets: Array<ExerciseSet>;
}>;

export const ExerciseTable = ({ sets }: Props) => {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data: sets,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

  return (
    <>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell className="pl-6" key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <footer className="flex items-center justify-end gap-2 border-t bg-background px-6 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </footer>
    </>
  );
};

const columns: Array<ColumnDef<ExerciseSet>> = [
  {
    accessorKey: "oneRepMax",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          one rep max
          {column.getIsSorted() === "desc" ? (
            <ArrowDown />
          ) : column.getIsSorted() === "asc" ? (
            <ArrowUp />
          ) : (
            <ChevronsUpDown />
          )}
        </Button>
      );
    },
    cell: ({ row }) => {
      const oneRepMax = getOneRepMaxEplay(
        row.original.weightInKg,
        row.original.repetitions,
      );

      return (
        <>
          <WeightValue weightInKg={oneRepMax} /> <WeightUnit />
        </>
      );
    },
  },
  {
    accessorKey: "weightInKg",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          weight
          {column.getIsSorted() === "desc" ? (
            <ArrowDown />
          ) : column.getIsSorted() === "asc" ? (
            <ArrowUp />
          ) : (
            <ChevronsUpDown />
          )}
        </Button>
      );
    },
    cell: ({ row }) => {
      return (
        <>
          <WeightValue weightInKg={row.original.weightInKg} /> <WeightUnit />
        </>
      );
    },
  },
  {
    accessorKey: "repetitions",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          repetitions
          {column.getIsSorted() === "desc" ? (
            <ArrowDown />
          ) : column.getIsSorted() === "asc" ? (
            <ArrowUp />
          ) : (
            <ChevronsUpDown />
          )}
        </Button>
      );
    },
  },
  {
    accessorKey: "doneAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          date
          {column.getIsSorted() === "desc" ? (
            <ArrowDown />
          ) : column.getIsSorted() === "asc" ? (
            <ArrowUp />
          ) : (
            <ChevronsUpDown />
          )}
        </Button>
      );
    },
    cell: ({ row }) => {
      return <>{row.original.doneAt.toLocaleDateString()}</>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const exerciseSet = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <ExerciseSetProvider value={exerciseSet}>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <UpdateExerciseSetWeightDialog />
              <UpdateExerciseSetRepetitionsDialog />
              <UpdateExerciseSetDoneAtDialog />
              <DropdownMenuSeparator />
              <DeleteExerciseSetDialog />
            </ExerciseSetProvider>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
