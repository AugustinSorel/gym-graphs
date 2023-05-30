import { addNewExerciseAction } from "./actions";
import { NewExerciseNameForm } from "./newExerciseNameForm";

const GridExercises = () => {
  return <NewExerciseNameForm action={addNewExerciseAction} />;
};

export default GridExercises;
