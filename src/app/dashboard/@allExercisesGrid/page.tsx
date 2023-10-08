import { db } from "@/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TimelineContainer } from "../timelineContainer";
import { Badge } from "@/components/ui/badge";
import type { ComponentProps, PropsWithChildren } from "react";
import type { Exercise, User } from "@/db/types";
import { GridLayout } from "../_grid/gridLayout";
import { DragComponent, SortableGrid } from "./sortableGrid";
import { GridItem } from "../_grid/gridItem";
import { LineGraph } from "../_graphs/lineGraph";
import { RadarGraph } from "../_graphs/radarGraph";
import { MoreHorizontal, Tag } from "lucide-react";
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
import { UpdateExerciseNameDialog } from "../_modals/updateExerciseNameDialog";
import { DeleteExerciseAlertDialog } from "../_modals/deleteExerciseAlertDialog";
import {
  deleteExerciseAction,
  updateExerciseNameAction,
} from "@/serverActions/exercises";
import { filterGridItems } from "../_grid/filterGridItems";
import { ExerciseMuscleGroupsDropdown } from "./exerciseMuscleGroups";
//TODO: optimistic update when adding / updating / removing exercise

const AllExercisesGrid = async (props: {
  searchParams: { tags: string } | undefined;
}) => {
  const session = await getServerSession(authOptions);

  if (!session || !session.user.id) {
    return redirect("/");
  }

  const tags = props.searchParams?.tags;

  const exercises = filterGridItems(
    await getExercises(session.user.id),
    tags ? tags.split(",") : []
  );

  if (exercises.length < 1) {
    return (
      <Container>
        <Title>no data</Title>
        <Text>
          Your dashboard is empty
          <br />
          Start adding new data with the form above
        </Text>
      </Container>
    );
  }

  return (
    <TimelineContainer>
      <Badge variant="accent" className="mx-auto lg:ml-0 lg:mr-auto">
        <time dateTime="all">all</time>
      </Badge>
      <GridLayout>
        <SortableGrid
          gridItems={exercises.map((exercise) => ({
            id: exercise.id,
            render: (
              <GridItem.Root>
                <GridItem.Anchor
                  aria-label={`go to ${exercise.name}`}
                  href={`/exercises/${exercise.id}`}
                />
                <GridItem.Header>
                  <GridItem.Title>{exercise.name}</GridItem.Title>

                  <GridItem.ActionContainer>
                    <ExerciseMuscleGroupsDropdown exercise={exercise}>
                      <GridItem.ActionButton aria-label="view exercise tags">
                        <Tag className="h-4 w-4" />
                      </GridItem.ActionButton>
                    </ExerciseMuscleGroupsDropdown>

                    <ExerciseDropDown exercise={exercise}>
                      <GridItem.ActionButton aria-label="view more">
                        <MoreHorizontal className="h-4 w-4" />
                      </GridItem.ActionButton>
                    </ExerciseDropDown>

                    <DragComponent id={exercise.id} />
                  </GridItem.ActionContainer>
                </GridItem.Header>

                <LineGraph data={exercise.data} />
              </GridItem.Root>
            ),
          }))}
        />

        <GridItem.Root>
          <GridItem.Header>
            <GridItem.Title>exercises count</GridItem.Title>
          </GridItem.Header>

          <RadarGraph
            data={exercises.map((exercise) => ({
              exerciseName: exercise.name,
              frequency: exercise.data.length,
            }))}
          />
        </GridItem.Root>
      </GridLayout>
    </TimelineContainer>
  );
};

export default AllExercisesGrid;

const Container = (props: ComponentProps<"div">) => {
  return (
    <div
      {...props}
      className="mt-10 flex flex-col items-center space-y-5 text-center"
    />
  );
};

const Title = (props: ComponentProps<"h1">) => {
  return <h1 {...props} className="text-6xl font-bold uppercase" />;
};

const Text = (props: ComponentProps<"p">) => {
  return <p {...props} className="text-xl text-muted-foreground" />;
};

const getExercises = async (userId: User["id"]) => {
  return (
    await db.query.exercises.findMany({
      where: (exercise, { eq }) => eq(exercise.userId, userId),
      with: {
        data: { orderBy: (data, { asc }) => [asc(data.doneAt)] },
        position: true,
      },
    })
  ).sort((a, b) => b.position.gridPosition - a.position.gridPosition);
};

const ExerciseDropDown = ({
  exercise,
  children,
}: { exercise: Exercise } & PropsWithChildren) => {
  return (
    <DropdownMenu>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p className="capitalize">view more</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel className="capitalize">settings</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <UpdateExerciseNameDialog
            onAction={updateExerciseNameAction}
            exercise={exercise}
          />
          <DeleteExerciseAlertDialog
            onAction={deleteExerciseAction}
            exercise={exercise}
          />
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
