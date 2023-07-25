import { addNewExerciseAction } from "@/serverActions/exercises";
import { NewExerciseForm } from "./newExerciseNameForm";

const GridExercises = () => {
  return <NewExerciseForm action={addNewExerciseAction} />;
};

export default GridExercises;
