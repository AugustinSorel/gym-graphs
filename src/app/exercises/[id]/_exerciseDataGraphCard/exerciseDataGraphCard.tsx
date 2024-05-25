"use client";

import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { Card, CardErrorFallback, CardSkeleton } from "../_components/card";
import { ExerciseDataGraph } from "./exerciseDataGraph";
import { useExercisePageContext } from "../_components/exercisePageContext";

export const ExerciseDataGraphCard = () => {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary FallbackComponent={CardErrorFallback} onReset={reset}>
          <Suspense fallback={<CardSkeleton />}>
            <Content />
          </Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
};

const Content = () => {
  const pageCtx = useExercisePageContext();

  return (
    <Card.Root>
      <Card.Header>
        <Card.Title>{pageCtx.exercise.name}</Card.Title>
      </Card.Header>

      <Card.Body>
        <ExerciseDataGraph />
      </Card.Body>
    </Card.Root>
  );
};
