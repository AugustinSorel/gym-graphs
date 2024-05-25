"use client";

import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { Card, CardErrorFallback, CardSkeleton } from "../_components/card";
import { ExerciseDataTable } from "./exerciseDataTable";
import { exerciseDataTableColumns } from "./exerciseDataTableColumns";

export const ExerciseDataTableCard = () => {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary FallbackComponent={CardErrorFallback} onReset={reset}>
          <Suspense fallback={<CardSkeleton />}>
            <Card.Root>
              <ExerciseDataTable columns={exerciseDataTableColumns} />
            </Card.Root>
          </Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
};
