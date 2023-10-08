"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { useState, type ComponentProps } from "react";
import { MuscleGroupsDropdown } from "../muscleGroupsDropdown";
import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { usePathname, useSearchParams } from "next/navigation";
import type { Exercise } from "@/db/types";

const Page = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tags = searchParams.get("tags");

  const [selectedValues, setSelectedValues] = useState(
    tags ? tags.split(",") : []
  );

  const updateUrlParams = (muscleGroups: Exercise["muscleGroups"]) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));

    if (muscleGroups.length < 1) {
      current.delete("tags");
    } else {
      current.set("tags", muscleGroups.join(","));
    }

    const search = current.toString();
    const query = search ? `?${search}` : "";

    void router.push(`${pathname}${query}`);
  };

  return (
    <Container>
      <MuscleGroupsDropdown
        selectedValues={selectedValues as Exercise["muscleGroups"]}
        updateValues={(values) => {
          setSelectedValues(values);
          updateUrlParams(values);
        }}
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
