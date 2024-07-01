import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ComponentPropsWithoutRef } from "react";
import type { FallbackProps } from "react-error-boundary";

const Root = (props: ComponentPropsWithoutRef<"section">) => {
  return (
    <section
      {...props}
      className={cn(
        "w-full border border-border bg-primary sm:rounded-md",
        props.className,
      )}
    />
  );
};

const ErrorFallback = (props: FallbackProps) => {
  const errorMessage =
    props.error instanceof Error
      ? props.error.message
      : JSON.stringify(props.error);

  return (
    <Card.Root className="border-destructive bg-destructive/5 hover:bg-destructive/10">
      <Card.Body>
        <Card.Title>Something else wrong</Card.Title>
        <code className="flex max-h-full overflow-auto">
          Error: {errorMessage}
        </code>
        <Button onClick={props.resetErrorBoundary} variant="destructive">
          try again
        </Button>
      </Card.Body>
    </Card.Root>
  );
};

const Title = (props: ComponentPropsWithoutRef<"h2">) => {
  return (
    <h2
      {...props}
      className={cn("text-lg font-semibold capitalize", props.className)}
    />
  );
};

const Description = (props: ComponentPropsWithoutRef<"p">) => {
  return <p className="text-sm" {...props} />;
};

const Body = (props: ComponentPropsWithoutRef<"div">) => {
  return <div {...props} className={cn("space-y-3 p-5", props.className)} />;
};

const Footer = (props: ComponentPropsWithoutRef<"footer">) => {
  return (
    <footer
      {...props}
      className={cn(
        "flex justify-end border-t border-border px-5 py-2",
        props.className,
      )}
    />
  );
};

export const Card = {
  Root,
  Body,
  ErrorFallback,
  Title,
  Description,
  Footer,
};
