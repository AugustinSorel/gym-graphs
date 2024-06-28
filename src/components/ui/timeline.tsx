import { GridSkeleton } from "@/components/ui/gridLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ComponentProps, ComponentPropsWithoutRef } from "react";
import type { FallbackProps } from "react-error-boundary";

export const Timeline = (props: ComponentProps<"div">) => {
  return (
    <div
      {...props}
      className={cn(
        "relative flex flex-col gap-5 pb-20 text-center before:absolute before:-left-10 before:bottom-0 before:top-0 before:w-1 before:bg-border before:backdrop-blur-md after:absolute after:-left-12 after:top-0 after:aspect-square after:w-5 after:rounded-full after:bg-border after:backdrop-blur-xl first-of-type:mt-10 last-of-type:pb-0",
        props.className,
      )}
    />
  );
};

export const TimelineActionsContainer = (
  props: ComponentPropsWithoutRef<"div">,
) => {
  return <div {...props} className="flex items-center gap-2" />;
};

export const TimelineErrorFallback = (props: FallbackProps) => {
  const errorMessage =
    props.error instanceof Error
      ? props.error.message
      : JSON.stringify(props.error);

  return (
    <Timeline className=" before:bg-destructive after:bg-destructive">
      <Badge variant="accent" className="mr-auto">
        <time dateTime="all">all</time>
      </Badge>

      <ErrorTitle>Something went wrong</ErrorTitle>
      <ErrorSubText>Sorry, we could not load your exercises:</ErrorSubText>
      <ErrorDescription>{errorMessage}</ErrorDescription>
      <Button
        onClick={props.resetErrorBoundary}
        className="mx-auto w-max lg:ml-0"
      >
        try again
      </Button>
    </Timeline>
  );
};

const ErrorTitle = (props: ComponentPropsWithoutRef<"h2">) => {
  return (
    <h2
      className="mx-auto text-xl font-bold text-destructive lg:ml-0 lg:mr-auto"
      {...props}
    />
  );
};

const ErrorSubText = (props: ComponentPropsWithoutRef<"p">) => {
  return <p className="lg:text-left" {...props} />;
};

const ErrorDescription = (props: ComponentPropsWithoutRef<"code">) => {
  return (
    <code
      className="block rounded-md border border-border bg-primary px-2 py-4 backdrop-blur-md"
      {...props}
    />
  );
};

export const TimelineSkeleton = () => {
  return (
    <Timeline>
      <Badge variant="accent" className="w-max">
        months
      </Badge>

      <GridSkeleton />
    </Timeline>
  );
};
