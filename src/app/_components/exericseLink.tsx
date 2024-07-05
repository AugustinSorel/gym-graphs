"use client";

import {
  BreadcrumbErrorFallBack,
  BreadcrumbItem,
  BreadcrumbSkeleton,
} from "@/components/ui/breadcrumb";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { Suspense, type PropsWithChildren } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useExercises } from "../dashboard/_components/useExercises";
import { useExercisePageParams } from "../exercises/[id]/_components/useExercisePageParams";

export const ExerciseLinkGuard = (props: PropsWithChildren) => {
  const pathName = usePathname();
  const routes = ["/exercises"];

  const canShowRoute = routes.some((route) => pathName.startsWith(route));

  if (!canShowRoute) {
    return null;
  }

  return <>{props.children}</>;
};

export const ExerciseLinkItem = () => {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          FallbackComponent={BreadcrumbErrorFallBack}
          onReset={reset}
        >
          <Suspense fallback={<BreadcrumbSkeleton />}>
            <Content />
          </Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
};

const Content = () => {
  const exercises = useExercises();
  const params = useExercisePageParams();

  const exercise = exercises.find((exercise) => exercise.id === params.id);

  if (!exercise) {
    throw new Error("exercise not found");
  }

  return (
    <>
      <BreadcrumbItem>{exercise.name}</BreadcrumbItem>
    </>
  );
};
