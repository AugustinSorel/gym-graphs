"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { ExerciseCard } from "./exerciseCard";

const ExercisesGrid = () => {
  return (
    <ul className="mx-auto grid max-w-[calc(var(--exercise-card-height)*4+20px*3)] grid-cols-[repeat(auto-fill,minmax(min(100%,var(--exercise-card-height)),1fr))] gap-5">
      {[...Array<unknown>(10)].map((_, i) => (
        <ExerciseCard key={i} />
      ))}

      {[...Array<unknown>(10)].map((_, i) => (
        <li key={i}>
          <Skeleton className="h-exercise-card rounded-md border border-border bg-primary backdrop-blur-md">
            <header className="h-11 border-b border-border bg-primary" />
          </Skeleton>
        </li>
      ))}
    </ul>
  );
};

export default ExercisesGrid;
