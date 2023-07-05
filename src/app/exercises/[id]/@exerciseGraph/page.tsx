import { ExerciseGraph } from "./exerciseGraph";

const Page = () => {
  return (
    <div className="rounded-md border border-border bg-primary backdrop-blur-md">
      <header className="border-b border-border bg-primary p-3">
        <h2 className="truncate font-medium capitalize">bench press</h2>
      </header>

      <div className="h-[500px]">
        <ExerciseGraph />
      </div>
    </div>
  );
};

export default Page;
