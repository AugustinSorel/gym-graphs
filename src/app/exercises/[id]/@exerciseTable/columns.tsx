"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Edit2, MoreHorizontal, Trash } from "lucide-react";
import UpdateNumberOfRepsForm from "./updateNumberOfRepsForm";

//FIXME: infer type from drizzle
export type ExerciseData = {
  estimatedPR: number;
  numberOfReps: number;
  weightLifted: number;
  date: Date;
};

export const columns: ColumnDef<ExerciseData>[] = [
  {
    accessorKey: "estimatedPR",
    header: ({ column }) => {
      return (
        <Button
          variant="link"
          className="px-2 md:px-4"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <span className="hidden md:block">estimated pr - (kg)</span>
          <span className="md:hidden">pr</span>
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "numberOfReps",
    header: ({ column }) => {
      return (
        <Button
          variant="link"
          className="px-2 md:px-4"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <span className="hidden md:block">№ of reps</span>
          <span className="md:hidden">reps</span>
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "weightLifted",
    header: ({ column }) => {
      return (
        <Button
          variant="link"
          className="px-2 md:px-4"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <span className="hidden md:block">weight - (kg)</span>
          <span className="md:hidden">kg</span>

          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "date",
    header: ({ column }) => {
      return (
        <Button
          variant="link"
          className="px-2 md:px-4"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
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

        <DropdownMenuContent align="end">
          <UpdateNumberOfRepsForm />
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <Edit2 className="mr-2 h-4 w-4" />
            <span className="capitalize">change weight lifted</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive/80 focus:bg-destructive/20 focus:text-destructive"
            onSelect={(e) => e.preventDefault()}
          >
            <Trash className="mr-2 h-4 w-4" />
            <span className="capitalize">delete data</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];
