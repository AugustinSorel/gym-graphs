import type { PropsWithChildren } from "react";

export const GridLayout = (props: PropsWithChildren) => {
  return (
    <div
      className="mx-auto grid w-full max-w-[calc(var(--exercise-card-height)*4+20px*3)] grid-cols-[repeat(auto-fill,minmax(min(100%,var(--exercise-card-height)),1fr))] gap-5"
      {...props}
    />
  );
};
