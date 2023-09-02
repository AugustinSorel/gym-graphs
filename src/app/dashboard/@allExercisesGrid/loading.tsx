//FIXME: backdrop not working in loading
import { Skeleton } from "@/components/ui/skeleton";
import { GridLayout } from "../_grid/gridLayout";
import { TimelineContainer } from "../timelineContainer";
import { Badge } from "@/components/ui/badge";

const Loader = () => {
  return (
    <TimelineContainer>
      <Badge variant="accent" className="mx-auto lg:ml-0 lg:mr-auto">
        <time dateTime="all">all</time>
      </Badge>
      <Skeleton>
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
