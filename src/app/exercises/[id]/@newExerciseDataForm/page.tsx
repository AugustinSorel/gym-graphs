import { addExerciseDataAction } from "./actions";
import { NewExerciseDataForm } from "./newExerciseDataForm";

const Page = () => {
  return <NewExerciseDataForm action={addExerciseDataAction} />;
};

export default Page;
