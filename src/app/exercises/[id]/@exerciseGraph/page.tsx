"use client";

import { ExerciseGraph } from "./exerciseGraph";
import { useExercise } from "../exerciseContext";

const Page = () => {
  const exercise = useExercise();

  return (
    <div className="border-y border-border bg-primary backdrop-blur-md sm:rounded-md sm:border">
      <header className="border-b border-border bg-primary p-3">
        <h2 className="truncate font-medium capitalize">{exercise.name}</h2>
      </header>

      <div className="relative h-[500px] overflow-hidden">
        <ExerciseGraph />
      </div>
    </div>
  );
};

export default Page;
