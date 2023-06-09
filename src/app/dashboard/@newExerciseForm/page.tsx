import { addNewExerciseAction } from "./actions";
import { NewExerciseForm } from "./newExerciseNameForm";

const GridExercises = () => {
  return <NewExerciseForm action={addNewExerciseAction} />;
};

export default GridExercises;
