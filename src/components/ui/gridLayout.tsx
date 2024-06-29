import { Skeleton } from "@/components/ui/skeleton";
import type { PropsWithChildren } from "react";

export const GridLayout = (props: PropsWithChildren) => {
  return (
    <div
      className="grid w-full grid-cols-[repeat(auto-fill,minmax(min(100%,var(--exercise-card-height)),1fr))] gap-5"
      {...props}
    />
  );
};

export const GridSkeleton = () => {
  return (
    <GridLayout>
      {[...Array<unknown>(20)].map((_, i) => (
        <Skeleton
          key={i}
          className="h-exercise-card rounded-md border border-border bg-primary backdrop-blur-md"
        >
          <header className="h-11 border-b border-border bg-primary" />
        </Skeleton>
      ))}
    </GridLayout>
  );
};
