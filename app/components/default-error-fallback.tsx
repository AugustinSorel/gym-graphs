import { ErrorComponentProps } from "@tanstack/react-router";
import { ComponentProps } from "react";
import { Button } from "../ui/button";

export const DefaultErrorFallback = (props: ErrorComponentProps) => {
  return (
    <Container>
      <HGroup>
        <Title>something went wrong</Title>
        <ErrorMsg>{props.error.message}</ErrorMsg>
      </HGroup>
      <Footer>
        <Button size="sm" onClick={props.reset} variant="destructive">
          try again
        </Button>
      </Footer>
    </Container>
  );
};

const Container = (props: ComponentProps<"div">) => {
  return (
    <div
      role="alert"
      className="rounded-md border border-destructive bg-destructive/10"
      {...props}
    />
  );
};

const HGroup = (props: ComponentProps<"hgroup">) => {
  return <hgroup className="space-y-3 p-6" {...props} />;
};

const Footer = (props: ComponentProps<"footer">) => {
  return (
    <footer
      className="flex items-center justify-end border-t border-destructive bg-destructive/10 px-6 py-4"
      {...props}
    />
  );
};

const Title = (props: ComponentProps<"h2">) => {
  return <h2 className="text-xl font-semibold capitalize" {...props} />;
};

const ErrorMsg = (props: ComponentProps<"code">) => {
  return <code className="flex text-sm" {...props} />;
};
