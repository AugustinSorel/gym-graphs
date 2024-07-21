"use client";

import {
  BreadcrumbErrorFallBack,
  BreadcrumbItem,
  BreadcrumbSeparator,
  BreadcrumbSkeleton,
} from "@/components/ui/breadcrumb";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useExercises } from "../dashboard/_components/useExercises";
import { useExercisePageParams } from "../exercises/[id]/_components/useExercisePageParams";
import Link from "next/link";
import { Check, ChevronDownIcon } from "lucide-react";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const ExercisesBreadcrumb = () => {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          fallback={
            <>
              <BreadcrumbSeparator className="text-destructive" />
              <BreadcrumbErrorFallBack />
              <ChevronDownIcon className="h-4 w-4 text-destructive" />
            </>
          }
          onReset={reset}
        >
          <Suspense
            fallback={
              <>
                <BreadcrumbSeparator />
                <BreadcrumbSkeleton />
                <ChevronDownIcon className="h-4 w-4" />
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
  const [exercises] = useExercises();
  const params = useExercisePageParams();

  const exercise = exercises.find((exercise) => exercise.id === params.id);

  if (!exercise) {
    throw new Error("exercise not found");
  }

  return (
    <>
      <BreadcrumbSeparator />

      <BreadcrumbItem className="block max-w-xs truncate">
        {exercise.name}
      </BreadcrumbItem>

      <DropdownMenuTrigger className="flex items-center gap-1">
        <ChevronDownIcon className="h-4 w-4" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="scrollbar max-h-[400px] w-[200px] overflow-auto p-1"
      >
        <>
          {!exercises.length && (
            <p className="text-center text-sm text-muted-foreground">
              0 exercises
            </p>
          )}

          {exercises.map((exercise) => (
            <DropdownMenuItem
              key={exercise.id}
              className="grid w-full grid-cols-[1fr_1rem] items-center gap-2 rounded-sm bg-transparent px-2 transition-colors hover:bg-primary"
              asChild
            >
              <Link href={`/exercises/${exercise.id}`}>
                <span className="truncate text-sm">{exercise.name}</span>
                {params.id === exercise.id && <Check className="h-4 w-4" />}
              </Link>
            </DropdownMenuItem>
          ))}
        </>
      </DropdownMenuContent>
    </>
  );
};
