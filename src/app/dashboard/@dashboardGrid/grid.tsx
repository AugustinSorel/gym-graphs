import type { PropsWithChildren } from "react";

export const DashboardGrid = (props: PropsWithChildren) => {
  return (
    <ul
      className="mx-auto grid max-w-[calc(var(--exercise-card-height)*4+20px*3)] grid-cols-[repeat(auto-fill,minmax(min(100%,var(--exercise-card-height)),1fr))] gap-5"
      {...props}
    />
  );
};
