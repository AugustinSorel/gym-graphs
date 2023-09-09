import type { ComponentProps } from "react";

export const TimelineContainer = (props: ComponentProps<"div">) => {
  return (
    <div
      {...props}
      className="relative flex flex-col gap-5 pb-20 text-center before:absolute before:-left-10 before:bottom-0 before:top-0 before:w-1 before:bg-border before:backdrop-blur-md after:absolute after:-left-12 after:top-0 after:aspect-square after:w-5 after:rounded-full after:bg-border after:backdrop-blur-xl first-of-type:mt-10 last-of-type:pb-0"
    />
  );
};
