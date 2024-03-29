"use client";

import { Button } from "@/components/ui/button";
import type { ComponentPropsWithoutRef } from "react";

type Props = {
  error: Error;
  reset: () => void;
};
const Error = (props: Props) => {
  return (
    <>
      <Card>
        <CardHeader />
        <CardBody>
          <ErrorTitle>Something went wrong</ErrorTitle>
          <ErrorSubText>
            Sorry, we could not load your exercise graph:
          </ErrorSubText>
          <ErrorDescription>{JSON.stringify(props)}</ErrorDescription>
          <Button onClick={props.reset}>try again</Button>
        </CardBody>
      </Card>

      <Card>
        <CardHeader />
        <CardBody>
          <ErrorTitle>Something went wrong</ErrorTitle>
          <ErrorSubText>
            Sorry, we could not load your exercise table:
          </ErrorSubText>
          <ErrorDescription>{JSON.stringify(props)}</ErrorDescription>
          <Button onClick={props.reset}>try again</Button>
        </CardBody>
        <CardFooter />
      </Card>
    </>
  );
};

export default Error;

const Card = (props: ComponentPropsWithoutRef<"div">) => {
  return (
    <div
      {...props}
      className="border-y border-border bg-destructive/10 backdrop-blur-md sm:rounded-md sm:border"
    />
  );
};

const CardHeader = (props: ComponentPropsWithoutRef<"header">) => {
  return (
    <header {...props} className="h-12 border-b border-border bg-primary p-3" />
  );
};

const CardBody = (props: ComponentPropsWithoutRef<"div">) => {
  return (
    <div
      {...props}
      className="relative flex h-[500px] flex-col items-center justify-center gap-5 overflow-hidden"
    />
  );
};

const ErrorTitle = (props: ComponentPropsWithoutRef<"h2">) => {
  return <h2 className="text-xl font-bold text-destructive " {...props} />;
};

const ErrorSubText = (props: ComponentPropsWithoutRef<"p">) => {
  return <p {...props} />;
};

const ErrorDescription = (props: ComponentPropsWithoutRef<"code">) => {
  return (
    <code
      className="block rounded-md border border-border bg-primary px-2 py-4 backdrop-blur-md"
      {...props}
    />
  );
};

const CardFooter = (props: ComponentPropsWithoutRef<"header">) => {
  return (
    <header {...props} className="h-12 border-t border-border bg-primary p-3" />
  );
};
