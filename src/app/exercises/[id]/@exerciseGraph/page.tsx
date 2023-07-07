import { ExerciseGraph } from "./exerciseGraph";

const Page = () => {
  return (
    <div className="border-y border-border bg-primary backdrop-blur-md sm:rounded-md sm:border">
      <header className="border-b border-border bg-primary p-3">
        <h2 className="truncate font-medium capitalize">bench press</h2>
      </header>

      <div className="relative h-[500px]">
        <ExerciseGraph />
      </div>
    </div>
  );
};

export default Page;
