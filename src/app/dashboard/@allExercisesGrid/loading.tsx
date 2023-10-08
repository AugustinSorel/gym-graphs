import { Skeleton } from "@/components/ui/skeleton";
import { GridLayout } from "../_grid/gridLayout";
import { TimelineContainer } from "../timelineContainer";
import { Badge } from "@/components/ui/badge";

const Loader = () => {
  return (
    <TimelineContainer>
      <div className="flex items-center gap-2">
        <Badge variant="accent" className="mr-auto">
          <time dateTime="all">all</time>
        </Badge>

        <div className="h-8 w-40 rounded-md border border-border bg-primary backdrop-blur-md" />
        <div className="h-8 w-8 rounded-md border border-border bg-primary backdrop-blur-md" />
      </div>
      <Skeleton className="backdrop-blur-md">
        <GridLayout>
          {[...Array<unknown>(15)].map((_, i) => (
            <li key={i}>
              <div className="h-exercise-card rounded-md border border-border bg-primary backdrop-blur-md">
                <header className="h-11 border-b border-border bg-primary" />
              </div>
            </li>
          ))}
        </GridLayout>
      </Skeleton>
    </TimelineContainer>
  );
};

export default Loader;
