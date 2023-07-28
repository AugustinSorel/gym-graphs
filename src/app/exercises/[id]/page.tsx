import { getExercise } from "@/fakeData";
import ExerciseGraph from "./@exerciseGraph/page";
import ExerciseTable from "./@exerciseTable/page";
import { ExerciseProvider } from "./exerciseContext";
import { redirect } from "next/navigation";
import type { ComponentProps } from "react";

const Page = (props: { params: { id: string } }) => {
  const exercise = getExercise(props.params.id.replace(/%20/g, " "));

  if (!exercise) {
    return redirect("/dashboard");
  }

  return (
    <ExerciseProvider exercise={exercise}>
      <ContentContainer>
        <ExerciseGraph />
        <ExerciseTable />
      </ContentContainer>
    </ExerciseProvider>
  );
};

export default Page;

const ContentContainer = (props: ComponentProps<"div">) => {
  return (
    <div
      {...props}
      className="mx-auto max-w-[calc(var(--exercise-card-height)*4+20px*3)] space-y-5 pb-5 pt-0 sm:px-5"
    />
  );
};
