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
import { UpdateNumberOfRepsForm } from "../_modals/updateNumberOfRepsForm";
import {
  deleteDataAction,
  updateExerciseDataDate,
  updateNumberOfRepsAction,
  updateWeightLiftedAction,
} from "@/serverActions/exerciseData";
import { UpdateWeightLifted } from "../_modals/updateWeightLiftedForm";
import { DeleteDataAlertDialog } from "../_modals/deleteDataAlertDialog";
import { useWeightUnit } from "@/context/weightUnit";
import { UpdateExerciseDataDate } from "../_modals/updateExerciseDataDate";
import { formatDate } from "@/lib/date";
import type { ExerciseData } from "@/db/types";
import { calculateOneRepMax } from "@/lib/math";

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
    cell: ({ row }) => {
      return (
        <>
          {calculateOneRepMax(
            row.original.weightLifted,
            row.original.numberOfRepetitions
          )}
        </>
      );
    },
  },
  {
    accessorKey: "numberOfRepetitions",
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
    accessorKey: "weightLifted",
    header: WeightLiftedHeader,
  },
  {
    accessorKey: "doneAt",
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
      const date = new Date(row.getValue("doneAt"));
      const formatted = formatDate(date);

      return <div>{formatted}</div>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
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

          <DropdownMenuContent align="end">
            <UpdateNumberOfRepsForm
              onAction={updateNumberOfRepsAction}
              exerciseData={row.original}
            />
            <UpdateWeightLifted
              onAction={updateWeightLiftedAction}
              exerciseData={row.original}
            />
            <UpdateExerciseDataDate
              onAction={updateExerciseDataDate}
              exerciseData={row.original}
            />
            <DeleteDataAlertDialog
              onAction={deleteDataAction}
              exerciseDataId={row.original.id}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
