import type { RouterOutputs } from "@/trpc/react";
import { Card } from "../ui/card";
import { GripVertical, MoreHorizontal, Tag } from "lucide-react";
import { LineGraph } from "../graphs/lineGraph";
import { DragComponent } from "@/app/dashboard/_allExercisesTimeline/sortableGrid";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RenameExerciseDialog } from "@/app/dashboard/_components/renameExerciseDialog";
import { DeleteExerciseAlertDialog } from "@/app/dashboard/_components/deleteExerciseAlertDialog";
import { ExerciseMuscleGroupsDropdown } from "@/app/dashboard/_allExercisesTimeline/exerciseMuscleGroups";
import { dateAsYearMonthDayFormat } from "@/lib/date";

type Props = {
  exercise: RouterOutputs["exercise"]["get"];
};

export const ExerciseOverviewCard = ({ exercise }: Props) => {
  return (
    <Card.Root>
      <Card.Anchor
        aria-label={`go to ${exercise.name}`}
        href={`/exercises/${exercise.id}`}
      />
      <Card.Header>
        <Card.Title>{exercise.name}</Card.Title>

        <Card.ActionContainer>
          <ExerciseMuscleGroupsDropdown exercise={exercise}>
            <Card.ActionButton aria-label="view exercise tags">
              <Tag className="h-4 w-4" />
            </Card.ActionButton>
          </ExerciseMuscleGroupsDropdown>

          <DropdownMenu>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Card.ActionButton aria-label="view more">
                      <MoreHorizontal className="h-4 w-4" />
                    </Card.ActionButton>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="capitalize">view more</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel className="capitalize">
                settings
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <RenameExerciseDialog exercise={exercise} />
                <DeleteExerciseAlertDialog exercise={exercise} />
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DragComponent id={exercise.id} />
        </Card.ActionContainer>
      </Card.Header>

      <LineGraph data={exercise.data} />
    </Card.Root>
  );
};

export const ExerciseMonthlyOverviewCard = ({
  exercise,
  month,
}: Props & { month: Date }) => {
  return (
    <Card.Root>
      <Card.Anchor
        aria-label={`go to ${exercise.name}`}
        href={`/exercises/${exercise.id}?from=${dateAsYearMonthDayFormat(
          month,
        )}&to=${dateAsYearMonthDayFormat(
          new Date(month.getFullYear(), month.getMonth() + 1, 0),
        )}`}
      />
      <Card.Header>
        <Card.Title>{exercise.name}</Card.Title>
      </Card.Header>

      <LineGraph data={exercise.data} />
    </Card.Root>
  );
};

export const ExerciseOverviewDummyCard = ({ exercise }: Props) => {
  return (
    <Card.Root key={exercise.id}>
      <Card.Header>
        <Card.Title>{exercise.name}</Card.Title>

        <Card.ActionContainer>
          <Card.ActionButton aria-label="view exercise tags">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Tag className="h-4 w-4" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="capitalize">tags</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Card.ActionButton>

          <Card.ActionButton aria-label="view more">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <MoreHorizontal className="h-4 w-4" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="capitalize">view more</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Card.ActionButton>

          <Card.ActionButton aria-label="view more">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <GripVertical className="h-4 w-4" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="capitalize">drag exercise</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Card.ActionButton>
        </Card.ActionContainer>
      </Card.Header>

      <LineGraph data={exercise.data} />
    </Card.Root>
  );
};
