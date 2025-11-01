import { SetProvider } from "~/domains/set/set.context";
import { UpdateSetRepetitionsDialog } from "~/domains/set/components/update-set-repetitions-dialog";
import { DeleteSetDialog } from "~/domains/set/components/delete-set-dialog";
import { UpdateSetDoneAtDialog } from "~/domains/set/components/update-set-done-at-dialog";
import { WeightUnit } from "~/domains/user/components/weight-unit";
import { WeightValue } from "~/domains/user/components/weight-value";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/ui/dropdown-menu";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronsUpDownIcon,
  EllipsisIcon,
} from "~/ui/icons";
import { Button } from "~/ui/button";
import { useUser } from "~/domains/user/hooks/use-user";
import { calculateOneRepMax } from "~/domains/set/set.utils";
import { UpdateSetWeightDialog } from "~/domains/set/components/update-set-weight-dialog";
import type { ColumnDef } from "@tanstack/react-table";
import type { Set } from "@gym-graphs/db/schemas";
import type { Serialize } from "~/utils/json";

export const exerciseTableColumns: Array<ColumnDef<Serialize<Set>>> = [
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
            <ArrowDownIcon />
          ) : column.getIsSorted() === "asc" ? (
            <ArrowUpIcon />
          ) : (
            <ChevronsUpDownIcon />
          )}
        </Button>
      );
    },
    accessorFn: (row) => {
      return calculateOneRepMax(row.weightInKg, row.repetitions, "epley");
    },
    cell: ({ row }) => {
      return (
        <span className="whitespace-nowrap">
          <OneRepMaxWeightValue
            repetitions={row.original.repetitions}
            weightInKg={row.original.weightInKg}
          />{" "}
          <WeightUnit />
        </span>
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
            <ArrowDownIcon />
          ) : column.getIsSorted() === "asc" ? (
            <ArrowUpIcon />
          ) : (
            <ChevronsUpDownIcon />
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
            <ArrowDownIcon />
          ) : column.getIsSorted() === "asc" ? (
            <ArrowUpIcon />
          ) : (
            <ChevronsUpDownIcon />
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
            <ArrowDownIcon />
          ) : column.getIsSorted() === "asc" ? (
            <ArrowUpIcon />
          ) : (
            <ChevronsUpDownIcon />
          )}
        </Button>
      );
    },
    cell: ({ row }) => {
      return (
        <span suppressHydrationWarning>
          {new Date(row.original.doneAt).toLocaleDateString()}
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
      );
    },
  },
];

const OneRepMaxWeightValue = (
  props: Pick<Set, "weightInKg" | "repetitions">,
) => {
  const user = useUser();

  return calculateOneRepMax(
    props.weightInKg,
    props.repetitions,
    user.data.oneRepMaxAlgo,
  );
};

export const homePageExerciseTableColumns = exerciseTableColumns.filter((c) => {
  return c.id !== "actions";
});
