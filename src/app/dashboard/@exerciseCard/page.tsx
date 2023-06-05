import Link from "next/link";
import { CardDropDown } from "./cardDropDown";

const ExerciseCard = () => {
  const exerciseName = "bench press";

  const updateExerciseNameAction = async (e: FormData) => {
    "use server";

    await new Promise((res) => setTimeout(res, 1_000));
    console.log("e: ", e);
  };

  return (
    <li className="group relative h-exercise-card rounded-md border border-border bg-primary backdrop-blur-md duration-300 hover:scale-[1.02] hover:bg-border">
      <Link
        href="/exercises/1"
        className="absolute inset-0 -z-10 duration-300"
        aria-label={`go to exercise ${exerciseName}`}
      />

      <header className="flex items-center justify-between gap-2 border-b border-border bg-primary p-2">
        <p className="truncate capitalize">{exerciseName}</p>
        <CardDropDown updateExerciseNameFormAction={updateExerciseNameAction} />
      </header>
    </li>
  );
};

export default ExerciseCard;
