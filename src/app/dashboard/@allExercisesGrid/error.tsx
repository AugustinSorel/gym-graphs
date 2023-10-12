"use client";

import { Button } from "@/components/ui/button";
import type { ComponentProps } from "react";

type Props = {
  error: Error;
  reset: () => void;
};
const Error = (props: Props) => {
  return (
    <div data-containsError className="flex flex-col gap-5">
      <ErrorTitle>Something went wrong</ErrorTitle>
      <ErrorSubText>
        Sorry, we could not load all your exercises because:
      </ErrorSubText>
      <ErrorDescription>{JSON.stringify(props)}</ErrorDescription>
      <Button onClick={props.reset} className="mx-auto w-max lg:ml-0">
        try again
      </Button>
    </div>
  );
};

export default Error;

const ErrorTitle = (props: ComponentProps<"h2">) => {
  return (
    <h2
      className="mx-auto text-xl font-bold text-destructive lg:ml-0 lg:mr-auto"
      {...props}
    />
  );
};

const ErrorSubText = (props: ComponentProps<"p">) => {
  return <p className="lg:text-left" {...props} />;
};

const ErrorDescription = (props: ComponentProps<"code">) => {
  return (
    <code
      className="block rounded-md border border-border bg-primary px-2 py-4 backdrop-blur-md"
      {...props}
    />
  );
};
