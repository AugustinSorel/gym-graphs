import { getExercises } from "@/fakeData";
import { SortableGrid } from "./sortableGrid";

export default function Page() {
  const exercises = getExercises();

  return <SortableGrid exercises={exercises} />;
}
