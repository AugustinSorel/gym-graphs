import Link from "next/link";
import type { LinkProps } from "next/link";
import { Button } from "@/components/ui/button";
import type { ComponentProps } from "react";
import { forwardRef } from "react";

const Header = (props: ComponentProps<"header">) => {
  return (
    <header
      {...props}
      className="flex h-14 items-center gap-2 border-b border-border bg-primary px-2"
    />
  );
};

const ActionContainer = (props: ComponentProps<"div">) => {
  return (
    <div
      {...props}
      className="opacity-full-on-touch-device pointer-events-none z-10 flex items-center opacity-0 transition-all duration-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100"
    />
  );
};

const ActionButton = (props: ComponentProps<typeof Button>) => {
  return <Button className="h-8 p-1" size="icon" variant="ghost" {...props} />;
};

const Title = (props: ComponentProps<"p">) => {
  return <p {...props} className="mr-auto truncate capitalize" />;
};

const Anchor = (props: LinkProps) => {
  return <Link {...props} className="absolute inset-0" />;
};

const Root = forwardRef<HTMLLIElement, ComponentProps<"li">>((props, ref) => {
  return (
    <li
      {...props}
      ref={ref}
      className="group relative flex h-exercise-card flex-col rounded-md border border-border bg-primary backdrop-blur-md hover:bg-border"
    />
  );
});
Root.displayName = "GridItem";

export const GridItem = {
  Root,
  Header,
  ActionContainer,
  ActionButton,
  Title,
  Anchor,
};
