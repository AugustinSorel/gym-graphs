import type { PropsWithChildren } from "react";

export const GridLayout = (props: PropsWithChildren) => {
  return (
    <ul
      className="grid w-full grid-cols-[repeat(auto-fill,minmax(min(100%,var(--exercise-card-height)),1fr))] gap-5"
      {...props}
    />
  );
};
