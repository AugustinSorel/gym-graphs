import { Badge } from "@/components/ui/badge";
import { TimelineContainer } from "../timelineContainer";
import type { PropsWithChildren } from "react";

const Layout = ({ children }: PropsWithChildren) => {
  return (
    <TimelineContainer>
      <Badge variant="accent" className="mx-auto lg:ml-0 lg:mr-auto">
        <time dateTime="all">all</time>
      </Badge>
      {children}
    </TimelineContainer>
  );
};

export default Layout;
