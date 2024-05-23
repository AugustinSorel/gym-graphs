import { Timeline } from "../_components/timeline";
import { Badge } from "@/components/ui/badge";
import { Suspense, type ComponentPropsWithoutRef } from "react";
import { AllExercisesGrid } from "./allExercisesGrid";
import { FilterByExerciseName, FilterByExrerciseMuscleGroups } from "./filters";

export const AllExercisesTimeline = () => {
  return (
    <Timeline>
      <TimelineActionsContainer>
        <Badge variant="accent" className="mr-auto">
          <time dateTime="all">all</time>
        </Badge>

        <FilterByExerciseName />
        <FilterByExrerciseMuscleGroups />
      </TimelineActionsContainer>

      <Suspense fallback={<>loading...</>}>
        <AllExercisesGrid />
      </Suspense>
    </Timeline>
  );
};

const TimelineActionsContainer = (props: ComponentPropsWithoutRef<"div">) => {
  return <div {...props} className="flex items-center gap-2" />;
};
