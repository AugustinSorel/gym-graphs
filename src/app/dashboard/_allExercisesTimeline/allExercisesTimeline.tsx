"use client";

import {
  Timeline,
  TimelineActionsContainer,
  TimelineErrorFallback,
} from "@/components/ui/timeline";
import { Badge } from "@/components/ui/badge";
import { Suspense } from "react";
import { AllExercisesGrid } from "./allExercisesGrid";
import {
  FilterByExerciseName,
  FilterByExrerciseMuscleGroups,
} from "./exerciseFilters";
import { ErrorBoundary } from "react-error-boundary";
import { GridSkeleton } from "@/components/ui/gridLayout";
import { QueryErrorResetBoundary } from "@tanstack/react-query";

export const AllExercisesTimeline = () => {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          FallbackComponent={TimelineErrorFallback}
          onReset={reset}
        >
          <Timeline>
            <TimelineActionsContainer>
              <Badge variant="accent" className="mr-auto">
                <time dateTime="all">all</time>
              </Badge>

              <FilterByExerciseName />
              <FilterByExrerciseMuscleGroups />
            </TimelineActionsContainer>

            <Suspense fallback={<GridSkeleton />}>
              <AllExercisesGrid />
            </Suspense>
          </Timeline>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
};
