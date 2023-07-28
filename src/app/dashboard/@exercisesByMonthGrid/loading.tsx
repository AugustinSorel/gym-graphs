import { Skeleton } from "@/components/ui/skeleton";
import { GridLayout } from "../_grid/gridLayout";

const Loader = () => {
  return (
    <GridLayout>
      {[...Array<unknown>(10)].map((_, i) => (
        <li key={i}>
          <Skeleton className="h-exercise-card rounded-md border border-border bg-primary backdrop-blur-md">
            <header className="h-11 border-b border-border bg-primary" />
          </Skeleton>
        </li>
      ))}
    </GridLayout>
  );
};

export default Loader;
