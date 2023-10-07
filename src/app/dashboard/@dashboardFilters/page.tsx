"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDashboardFilters } from "../dashboardFiltersContext";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import type { ComponentProps } from "react";
import { MuscleGroupsDropdown } from "../muscleGroupsDropdown";
import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const Page = () => {
  const dashboardFilters = useDashboardFilters();

  return (
    <Container>
      <MuscleGroupsDropdown
        selectedValues={dashboardFilters.muscleGroups}
        updateValues={dashboardFilters.setMuscleGroups}
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button size="icon" className="relative h-8 p-1">
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p className="capitalize">tags</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </MuscleGroupsDropdown>
    </Container>
  );
};

export default Page;

const Container = (props: ComponentProps<"div">) => {
  return <div {...props} className="my-5 flex max-w-xl items-center gap-2" />;
};
