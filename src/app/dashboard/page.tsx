import { NewExerciseForm } from "./_newExerciseForm/newExerciseForm";
import { getServerAuthSession } from "@/server/auth";
import { redirect } from "next/navigation";
import { AllExercisesTimeline } from "./_allExercisesTimeline/allExercisesTimeline";
import { MonthlyExercisesTimelines } from "./_monthlyExercisesTimelines/monthlyExercisesTimelines";
import { HydrateClient, api } from "@/trpc/server";

const Page = async () => {
  const session = await getServerAuthSession();

  if (!session?.user.id) {
    return redirect("/sign-in");
  }

  void api.exercise.all.prefetch();

  return (
    <>
      <NewExerciseForm />

      <HydrateClient>
        <AllExercisesTimeline />
        <MonthlyExercisesTimelines />
      </HydrateClient>
    </>
  );
};

export default Page;
