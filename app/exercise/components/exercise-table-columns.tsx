import { UpdateSetWeightDialog } from "~/set/components/update-set-weight-dialog";
import { SetProvider } from "~/set/set.context";
import { UpdateSetRepetitionsDialog } from "~/set/components/update-set-repetitions-dialog";
import { DeleteSetDialog } from "~/set/components/delete-set-dialog";
import { UpdateSetDoneAtDialog } from "~/set/components/update-set-done-at-dialog";
import { WeightUnit } from "~/weight-unit/components/weight-unit";
import { WeightValue } from "~/weight-unit/components/weight-value";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/ui/dropdown-menu";
import {
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "~/ui/button";
import { useUser } from "~/user/hooks/use-user";
import { calculateOneRepMax } from "~/set/set.utils";
import type { ColumnDef } from "@tanstack/react-table";
import type { Set } from "~/db/db.schemas";

export const exerciseTableColumns: Array<ColumnDef<Set>> = [
  {
    accessorKey: "oneRepMax",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          size="sm"
        >
          <span className="hidden sm:block">one rep max</span>
          <span className="sm:hidden">pr</span>

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
    accessorFn: (row) => {
      const user = useUser();

      return calculateOneRepMax(
        row.weightInKg,
        row.repetitions,
        user.data.oneRepMaxAlgo,
      );
    },
    cell: ({ row }) => {
      const user = useUser();

      const oneRepMax = calculateOneRepMax(
        row.original.weightInKg,
        row.original.repetitions,
        user.data.oneRepMaxAlgo,
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
          size="sm"
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
          size="sm"
        >
          <span className="hidden sm:block">repetitions</span>
          <span className="sm:hidden">reps</span>

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
          size="sm"
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
      return (
        <span suppressHydrationWarning>
          {row.original.doneAt.toLocaleDateString()}
        </span>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const set = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
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
      );
    },
  },
];

export const homePageExerciseTableColumns = exerciseTableColumns.filter((c) => {
  return c.id !== "actions";
});
