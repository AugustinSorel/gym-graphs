"use client";

import {
  Suspense,
  type ComponentPropsWithoutRef,
  type PropsWithChildren,
} from "react";
import { ExercisePageContextProvider } from "./_components/exercisePageContext";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { Card } from "./_components/card";
import { useExercisePageParams } from "./_components/useExercisePageParams";
import { ExerciseDataGraphCard } from "./_exerciseDataGraph/exerciseDataGraphCard";
import { ExerciseDataTableCard } from "./_exerciseDataTable/exerciseDataTableCard";
import { useExercise } from "./_components/useExercise";

export const Content = () => {
  return (
    <ContentContainer>
      <QueryErrorResetBoundary>
        {({ reset }) => (
          <ErrorBoundary
            FallbackComponent={ContentErrorFallback}
            onReset={reset}
          >
            <Suspense fallback={<ContentSkeleton />}>
              <PageContext>
                <ErrorBoundary FallbackComponent={Card.ErrorFallback}>
                  <ExerciseDataGraphCard />
                </ErrorBoundary>

                <ErrorBoundary FallbackComponent={Card.ErrorFallback}>
                  <ExerciseDataTableCard />
                </ErrorBoundary>
              </PageContext>
            </Suspense>
          </ErrorBoundary>
        )}
      </QueryErrorResetBoundary>
    </ContentContainer>
  );
};

const ContentContainer = (props: ComponentPropsWithoutRef<"div">) => {
  return (
    <div
      {...props}
      className="mx-auto flex max-w-[calc(var(--exercise-card-height)*4+20px*3)] flex-col gap-10 pb-5 pt-0 sm:px-5"
    />
  );
};

const ContentErrorFallback = (props: FallbackProps) => (
  <>
    <Card.ErrorFallback {...props} />
    <Card.ErrorFallback {...props} />
  </>
);

const ContentSkeleton = () => {
  return (
    <>
      <Card.SkeletonFallback />
      <Card.SkeletonFallback />
    </>
  );
};

const PageContext = (props: PropsWithChildren) => {
  const params = useExercisePageParams();
  const [exercise] = useExercise({ id: params.id });

  if (!exercise) {
    throw new Error(`exercise with id: ${params.id} could not be found`);
  }

  return <ExercisePageContextProvider exercise={exercise} {...props} />;
};
