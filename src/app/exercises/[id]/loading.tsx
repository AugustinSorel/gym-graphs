import { Skeleton } from "@/components/ui/skeleton";
import type { ComponentProps } from "react";

const Loading = () => {
  return (
    <Skeleton className="backdrop-blur-md">
      <ContentContainer>
        <Card>
          <CardHeader />
          <CardBody />
        </Card>

        <Card>
          <CardHeader />
          <CardBody />
          <CardFooter />
        </Card>
      </ContentContainer>
    </Skeleton>
  );
};

export default Loading;

const ContentContainer = (props: ComponentProps<"div">) => {
  return (
    <div
      {...props}
      className="mx-auto max-w-[calc(var(--exercise-card-height)*4+20px*3)] space-y-10 pb-5 pt-0 sm:px-5"
    />
  );
};

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

const CardFooter = (props: ComponentProps<"header">) => {
  return (
    <header {...props} className="h-12 border-t border-border bg-primary p-3" />
  );
};

const CardBody = (props: ComponentProps<"div">) => {
  return <div {...props} className="relative h-[500px] overflow-hidden" />;
};
