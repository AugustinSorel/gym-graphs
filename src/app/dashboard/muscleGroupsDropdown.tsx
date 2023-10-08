import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { muscleGroupsEnum } from "@/db/schema";
import type { Exercise } from "@/db/types";
import type { PropsWithChildren } from "react";

type Props = {
  updateValues: (muscleGroups: Exercise["muscleGroups"]) => void;
  selectedValues: Exercise["muscleGroups"];
} & PropsWithChildren;

export const MuscleGroupsDropdown = (props: Props) => {
  const { children, updateValues, selectedValues } = props;

  return (
    <DropdownMenu>
      {children}
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel className="capitalize">
          muscle groups
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          {muscleGroupsEnum.enumValues.map((muscleGroup) => {
            const isSelected = selectedValues.includes(muscleGroup);
            return (
              <DropdownMenuCheckboxItem
                key={muscleGroup}
                checked={isSelected}
                onSelect={(e) => e.preventDefault()}
                onCheckedChange={() => {
                  const filteredMuscleGroups = isSelected
                    ? selectedValues.filter((v) => v !== muscleGroup)
                    : [...selectedValues, muscleGroup];

                  updateValues(filteredMuscleGroups);
                }}
              >
                {muscleGroup}
              </DropdownMenuCheckboxItem>
            );
          })}
        </DropdownMenuGroup>

        {selectedValues.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onSelect={() => updateValues([])}
                className="justify-center text-center"
              >
                Clear filters
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
