import type { ComponentProps, PropsWithChildren } from "react";
import { TimelineContainer } from "../timelineContainer";
import { Badge } from "@/components/ui/badge";
import { MuscleGroupsFilter, SearchFilter } from "./filtersComponent";

const Layout = ({ children }: PropsWithChildren) => {
  return (
    <TimelineContainer>
      <TimelineActionsContainer>
        <Badge variant="accent" className="mr-auto">
          <time dateTime="all">all</time>
        </Badge>

        <SearchFilter />
        <MuscleGroupsFilter />
      </TimelineActionsContainer>

      {children}
    </TimelineContainer>
  );
};

export default Layout;

const TimelineActionsContainer = (props: ComponentProps<"div">) => {
  return <div {...props} className="flex items-center gap-2" />;
};
