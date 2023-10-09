import { Skeleton } from "@/components/ui/skeleton";
import { GridLayout } from "../_grid/gridLayout";

const Loader = () => {
  return (
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
  );
};

export default Loader;
