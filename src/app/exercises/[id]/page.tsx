import { getExercise } from "@/fakeData";
import ExerciseGraph from "./@exerciseGraph/page";
import ExerciseTable from "./@exerciseTable/page";

const Page = (props: { params: { id: string } }) => {
  const exercise = getExercise(props.params.id.replace(/%20/g, " "));

  if (!exercise) {
    return null;
  }

  return (
    <div className="mx-auto max-w-[calc(var(--exercise-card-height)*4+20px*3)] space-y-5 pb-5 pt-0 sm:px-5">
      <ExerciseGraph exercise={exercise} />
      <ExerciseTable data={exercise.data} />
    </div>
  );
};

export default Page;
