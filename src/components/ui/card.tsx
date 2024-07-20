import Link from "next/link";
import type { LinkProps } from "next/link";
import { Button } from "@/components/ui/button";
import type { ComponentProps } from "react";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import type { FallbackProps } from "react-error-boundary";
import { Skeleton } from "@/components/ui/skeleton";

const Header = (props: ComponentProps<"header">) => {
  return (
    <header
      {...props}
      className={cn(
        "flex h-[3rem] max-h-[3rem] min-h-[3rem] items-center gap-2 border-b border-border bg-primary px-2",
        props.className,
      )}
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

const ActionButton = forwardRef<
  HTMLButtonElement,
  ComponentProps<typeof Button>
>((props, ref) => {
  return (
    <Button
      className="h-8 p-1"
      size="icon"
      variant="ghost"
      {...props}
      ref={ref}
    />
  );
});
ActionButton.displayName = "grid item action button";

const Title = (props: ComponentProps<"p">) => {
  return <p {...props} className="mr-auto truncate capitalize" />;
};

const Anchor = (props: LinkProps) => {
  return <Link {...props} className="absolute inset-0" />;
};

const Root = forwardRef<HTMLDivElement, ComponentProps<"div">>((props, ref) => {
  return (
    <div
      {...props}
      ref={ref}
      className={cn(
        "group relative flex h-exercise-card flex-col rounded-md border border-border bg-primary backdrop-blur-md transition-colors hover:bg-border",
        props.className,
      )}
    />
  );
});
Root.displayName = "Card";

export const ErrorFallback = (props: FallbackProps) => {
  const errorMessage =
    props.error instanceof Error
      ? props.error.message
      : JSON.stringify(props.error);

  return (
    <Card.Root className="border-destructive bg-destructive/5 hover:bg-destructive/10">
      <Card.Header className="border-destructive bg-destructive/10">
        <Card.Title>something went wrong</Card.Title>
      </Card.Header>

      <div className="flex h-full flex-col items-center justify-center gap-3 overflow-auto p-5">
        <code className="flex max-h-full overflow-auto">
          Error: {errorMessage}
        </code>
        <Button onClick={props.resetErrorBoundary} variant="destructive">
          try again
        </Button>
      </div>
    </Card.Root>
  );
};

const SkeletonFallback = () => {
  return (
    <Skeleton className="h-exercise-card rounded-md border border-border bg-primary backdrop-blur-md">
      <Card.Header />
    </Skeleton>
  );
};

export const Card = {
  Root,
  Header,
  ActionContainer,
  ActionButton,
  Title,
  Anchor,
  SkeletonFallback,
  ErrorFallback,
};
