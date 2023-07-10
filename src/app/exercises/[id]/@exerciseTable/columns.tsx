"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ColumnDef, HeaderContext } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { UpdateNumberOfRepsForm } from "./updateNumberOfRepsForm";
import {
  deleteDataAction,
  updateNumberOfRepsAction,
  updateWeightLiftedAction,
} from "./actions";
import { UpdateWeightLifted } from "./updateWeightLiftedForm";
import { DeleteDataAlertDialog } from "./deleteDataAlertDialog";
import { useWeightUnit } from "@/store/weightUnit";
import type { ExerciseData } from "@/fakeData";

const EstimatedPrHeader = ({
  column,
}: HeaderContext<ExerciseData, unknown>) => {
  const weightUnit = useWeightUnit();
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="link"
            className="px-2 md:px-4"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span className="hidden md:block">
              estimated pr - ({weightUnit.get})
            </span>
            <span className="md:hidden">pr</span>
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="capitalize">estimated personal record</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const WeightLiftedHeader = ({
  column,
}: HeaderContext<ExerciseData, unknown>) => {
  const weightUnit = useWeightUnit();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="link"
            className="px-2 md:px-4"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span className="hidden md:block">weight - ({weightUnit.get})</span>
            <span className="md:hidden">{weightUnit.get}</span>

            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="capitalize">weight lifted in</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const columns: ColumnDef<ExerciseData>[] = [
  {
    accessorKey: "oneRepMax",
    header: EstimatedPrHeader,
  },
  {
    accessorKey: "numberOfReps",
    header: ({ column }) => {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="link"
                className="px-2 md:px-4"
                onClick={() =>
                  column.toggleSorting(column.getIsSorted() === "asc")
                }
              >
                <span className="hidden md:block">№ of reps</span>
                <span className="md:hidden">reps</span>
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="capitalize">number of repetitions</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  },
  {
    accessorKey: "weight",
    header: WeightLiftedHeader,
  },
  {
    accessorKey: "date",
    header: ({ column }) => {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="link"
                className="px-2 md:px-4"
                onClick={() =>
                  column.toggleSorting(column.getIsSorted() === "asc")
                }
              >
                date
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="capitalize">date</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("date"));
      const formatted = date.toLocaleDateString("fr-fr", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      return <div>{formatted}</div>;
    },
  },
  {
    id: "actions",
    cell: () => (
      <DropdownMenu>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p className="capitalize">view more</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <DropdownMenuContent
          align="end"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <UpdateNumberOfRepsForm onAction={updateNumberOfRepsAction} />
          <UpdateWeightLifted onAction={updateWeightLiftedAction} />
          <DeleteDataAlertDialog onAction={deleteDataAction} />
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];
