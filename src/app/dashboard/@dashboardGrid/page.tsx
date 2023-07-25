import { getExercises } from "@/fakeData";
import { SortableGrid } from "./_grid/sortableGrid";

const Page = () => {
  const exercises = getExercises();

  return <SortableGrid exercises={exercises} />;
};

export default Page;
