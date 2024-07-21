import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ComponentPropsWithoutRef } from "react";
import type { FallbackProps } from "react-error-boundary";

const Root = (props: ComponentPropsWithoutRef<"div">) => {
  return (
    <div
      {...props}
      className={cn(
        "border-y border-border bg-primary backdrop-blur-md sm:rounded-md sm:border",
        props.className,
      )}
    />
  );
};

const Header = (props: ComponentPropsWithoutRef<"header">) => {
  return (
    <header
      {...props}
      className={cn("border-b border-border bg-primary p-3", props.className)}
    />
  );
};

const Title = (props: ComponentPropsWithoutRef<"h2">) => {
  return <h2 {...props} className="truncate font-medium capitalize" />;
};

const Body = (props: ComponentPropsWithoutRef<"div">) => {
  return (
    <div
      {...props}
      className={cn("relative h-[500px] overflow-hidden", props.className)}
    />
  );
};

const Footer = (props: ComponentPropsWithoutRef<"header">) => {
  return (
    <header {...props} className="h-12 border-t border-border bg-primary p-3" />
  );
};

const ErrorMessage = (props: ComponentPropsWithoutRef<"code">) => {
  return <code {...props} className="flex max-h-full overflow-auto" />;
};

const SkeletonFallback = () => {
  return (
    <Skeleton className="backdrop-blur-md">
      <Card.Root>
        <Card.Header className="h-12" />
        <Card.Body />
      </Card.Root>
    </Skeleton>
  );
};

const ErrorFallback = (props: FallbackProps) => {
  const errorMessage =
    props.error instanceof Error
      ? props.error.message
      : JSON.stringify(props.error);

  return (
    <Card.Root className="border-destructive bg-destructive/5">
      <Card.Header className="border-destructive bg-destructive/5 first-letter:capitalize">
        something went wrong
      </Card.Header>
      <Card.Body className="flex flex-col items-center justify-center gap-5 p-5">
        <Card.ErrorMessage>Error: {errorMessage}</Card.ErrorMessage>
        <Button onClick={props.resetErrorBoundary} variant="destructive">
          try again
        </Button>
      </Card.Body>
    </Card.Root>
  );
};

export const Card = {
  Root,
  Header,
  Body,
  Title,
  Footer,
  ErrorMessage,
  SkeletonFallback,
  ErrorFallback,
};
