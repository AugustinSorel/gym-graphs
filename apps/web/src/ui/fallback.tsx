import { Button } from "~/ui/button";
import type { ErrorComponentProps } from "@tanstack/react-router";
import type { ComponentProps } from "react";

export const FallbackContainer = (props: ComponentProps<"div">) => {
  return (
    <div
      role="alert"
      className="border-destructive bg-destructive/10 rounded-md border"
      {...props}
    />
  );
};

export const FallbackHeader = (props: ComponentProps<"hgroup">) => {
  return <hgroup className="space-y-3 p-6" {...props} />;
};

export const FallbackFooter = (props: ComponentProps<"footer">) => {
  return (
    <footer
      className="border-destructive bg-destructive/10 flex items-center justify-end border-t px-6 py-4"
      {...props}
    />
  );
};

export const FallbackTitle = (props: ComponentProps<"h2">) => {
  return <h2 className="text-xl font-semibold capitalize" {...props} />;
};

export const FallbackDescription = (props: ComponentProps<"code">) => {
  return <code className="flex text-sm" {...props} />;
};

export const DefaultFallback = (props: ErrorComponentProps) => {
  return (
    <FallbackContainer>
      <FallbackHeader>
        <FallbackTitle>something went wrong</FallbackTitle>
        <FallbackDescription>{props.error.message}</FallbackDescription>
      </FallbackHeader>
      <FallbackFooter>
        <Button size="sm" onClick={props.reset} variant="destructive">
          try again
        </Button>
      </FallbackFooter>
    </FallbackContainer>
  );
};
