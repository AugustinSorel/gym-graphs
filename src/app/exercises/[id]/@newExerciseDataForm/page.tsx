import { addExerciseDataAction } from "@/serverActions/exerciseData";
import { NewExerciseDataForm } from "./newExerciseDataForm";

const Page = () => {
  return <NewExerciseDataForm action={addExerciseDataAction} />;
};

export default Page;
