import { Skeleton } from "@/components/ui/skeleton";
import { GridLayout } from "../_grid/gridLayout";

const Loader = () => {
  return (
    <GridLayout>
      {[...Array<unknown>(20)].map((_, i) => (
        <Skeleton
          key={i}
          className="h-exercise-card rounded-md border border-border bg-primary backdrop-blur-md"
        >
          <header className="h-11 border-b border-border bg-primary" />
        </Skeleton>
      ))}
    </GridLayout>
  );
};

export default Loader;
