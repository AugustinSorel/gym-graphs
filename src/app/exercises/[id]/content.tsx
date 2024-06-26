"use client";

import {
  Suspense,
  type ComponentPropsWithoutRef,
  type PropsWithChildren,
} from "react";
import { ExercisePageContextProvider } from "./_components/exercisePageContext";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { CardErrorFallback, CardSkeleton } from "./_components/card";
import { useExercisePageParams } from "./_components/useExercisePageParams";
import { api } from "@/trpc/react";
import { ExerciseDataGraphCard } from "./_exerciseDataGraph/exerciseDataGraphCard";
import { ExerciseDataTableCard } from "./_exerciseDataTable/exerciseDataTableCard";

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
                <ErrorBoundary FallbackComponent={CardErrorFallback}>
                  <ExerciseDataGraphCard />
                </ErrorBoundary>

                <ErrorBoundary FallbackComponent={CardErrorFallback}>
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
      className="mx-auto flex max-w-[calc(var(--exercise-card-height)*4+20px*3)] flex-col gap-10  pb-5 pt-0 sm:px-5"
    />
  );
};

const ContentErrorFallback = (props: FallbackProps) => (
  <>
    <CardErrorFallback {...props} />
    <CardErrorFallback {...props} />
  </>
);

const ContentSkeleton = () => {
  return (
    <>
      <CardSkeleton />
      <CardSkeleton />
    </>
  );
};

const PageContext = (props: PropsWithChildren) => {
  const params = useExercisePageParams();
  const [exercise] = api.exercise.get.useSuspenseQuery({ id: params.id });

  if (!exercise) {
    throw new Error(`exercise with id: ${params.id} could not be found`);
  }

  return <ExercisePageContextProvider exercise={exercise} {...props} />;
};
