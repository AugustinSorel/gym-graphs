"use client";

import {
  Timeline,
  TimelineActionsContainer,
  TimelineErrorFallback,
} from "../_components/timeline";
import { Badge } from "@/components/ui/badge";
import { Suspense } from "react";
import { AllExercisesGrid } from "./allExercisesGrid";
import { FilterByExerciseName, FilterByExrerciseMuscleGroups } from "./filters";
import { ErrorBoundary } from "react-error-boundary";
import { GridSkeleton } from "../_components/grid/gridLayout";
import { QueryErrorResetBoundary } from "@tanstack/react-query";

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

      <QueryErrorResetBoundary>
        {({ reset }) => (
          <ErrorBoundary
            FallbackComponent={TimelineErrorFallback}
            onReset={reset}
          >
            <Suspense fallback={<GridSkeleton />}>
              <AllExercisesGrid />
            </Suspense>
          </ErrorBoundary>
        )}
      </QueryErrorResetBoundary>
    </Timeline>
  );
};
