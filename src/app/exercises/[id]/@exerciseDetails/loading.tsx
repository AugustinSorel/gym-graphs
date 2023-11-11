import { Skeleton } from "@/components/ui/skeleton";
import type { ComponentPropsWithoutRef } from "react";

const Loading = () => {
  return (
    <>
      <Skeleton className="backdrop-blur-md">
        <Card>
          <CardHeader />
          <CardBody />
        </Card>
      </Skeleton>

      <Skeleton className="backdrop-blur-md">
        <Card>
          <CardHeader />
          <CardBody />
          <CardFooter />
        </Card>
      </Skeleton>
    </>
  );
};

export default Loading;

const Card = (props: ComponentPropsWithoutRef<"div">) => {
  return (
    <div
      {...props}
      className="border-y border-border bg-primary backdrop-blur-md sm:rounded-md sm:border"
    />
  );
};

const CardHeader = (props: ComponentPropsWithoutRef<"header">) => {
  return (
    <header {...props} className="h-12 border-b border-border bg-primary p-3" />
  );
};

const CardBody = (props: ComponentPropsWithoutRef<"div">) => {
  return <div {...props} className="relative h-[500px] overflow-hidden" />;
};

const CardFooter = (props: ComponentPropsWithoutRef<"header">) => {
  return (
    <header {...props} className="h-12 border-t border-border bg-primary p-3" />
  );
};
