import type { Exercise } from "@/fakeData";
import { ExerciseGraph } from "./exerciseGraph";

const Page = ({ exercise }: { exercise: Exercise }) => {
  return (
    <div className="border-y border-border bg-primary backdrop-blur-md sm:rounded-md sm:border">
      <header className="border-b border-border bg-primary p-3">
        <h2 className="truncate font-medium capitalize">{exercise.name}</h2>
      </header>

      <div className="relative h-[500px] overflow-hidden">
        <ExerciseGraph data={exercise.data} />
      </div>
    </div>
  );
};

export default Page;
