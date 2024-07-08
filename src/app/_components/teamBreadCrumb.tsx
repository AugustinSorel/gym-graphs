"use client";

import {
  BreadcrumbErrorFallBack,
  BreadcrumbItem,
  BreadcrumbSeparator,
  BreadcrumbSkeleton,
} from "@/components/ui/breadcrumb";
import { api } from "@/trpc/react";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useTeamPageParams } from "../teams/[id]/_components/useTeamPageParams";

export const TeamBreadcrumb = () => {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          fallback={
            <>
              <BreadcrumbSeparator className="text-destructive" />
              <BreadcrumbErrorFallBack />
            </>
          }
          onReset={reset}
        >
          <Suspense
            fallback={
              <>
                <BreadcrumbSeparator />
                <BreadcrumbSkeleton />
              </>
            }
          >
            <Content />
          </Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
};

const Content = () => {
  const params = useTeamPageParams();
  const [team] = api.team.get.useSuspenseQuery({ id: params.id });

  return (
    <>
      <BreadcrumbSeparator />

      <BreadcrumbItem className="block max-w-xs truncate">
        {team.name}
      </BreadcrumbItem>
    </>
  );
};
