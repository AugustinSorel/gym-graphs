import { Skeleton } from "@/components/ui/skeleton";
import type { ComponentProps } from "react";

const Loader = () => {
  return (
    <Skeleton className="backdrop-blur-md">
      <Card>
        <CardHeader />
        <CardBody />
      </Card>
    </Skeleton>
  );
};

export default Loader;

const Card = (props: ComponentProps<"div">) => {
  return (
    <div
      {...props}
      className="border-y border-border bg-primary backdrop-blur-md sm:rounded-md sm:border"
    />
  );
};

const CardHeader = (props: ComponentProps<"header">) => {
  return (
    <header {...props} className="h-12 border-b border-border bg-primary p-3" />
  );
};

const CardBody = (props: ComponentProps<"div">) => {
  return <div {...props} className="relative h-[500px] overflow-hidden" />;
};
