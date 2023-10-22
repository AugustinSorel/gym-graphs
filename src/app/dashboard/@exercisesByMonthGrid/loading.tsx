import { Skeleton } from "@/components/ui/skeleton";
import { GridLayout } from "../_grid/gridLayout";
import { TimelineContainer } from "../timelineContainer";
import { Badge } from "@/components/ui/badge";

const Loader = () => {
  return (
    <>
      {[...Array<unknown>(3)].map((_, i) => (
        <TimelineContainer key={i}>
          <Skeleton className="w-min">
            <Badge
              variant="accent"
              className="mx-auto h-6 w-32 lg:ml-0 lg:mr-auto"
            />
          </Skeleton>

          <GridLayout>
            {[...Array<unknown>(10)].map((_, i) => (
              <Skeleton
                key={i}
                className="h-exercise-card rounded-md border border-border bg-primary backdrop-blur-md"
              >
                <header className="h-11 border-b border-border bg-primary" />
              </Skeleton>
            ))}
          </GridLayout>
        </TimelineContainer>
      ))}
    </>
  );
};

export default Loader;
