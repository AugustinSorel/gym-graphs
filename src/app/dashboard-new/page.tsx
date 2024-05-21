import { NewExerciseForm } from "./_components/newExerciseForm/newExerciseForm";
import { getServerAuthSession } from "@/server/auth";
import { redirect } from "next/navigation";
import { createSSRHelper } from "@/trpc/server";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { AllExercisesTimeline } from "./_components/allExercisesTimeline/allExercisesTimeline";

const Page = async () => {
  const session = await getServerAuthSession();

  if (!session?.user.id) {
    return redirect("/");
  }

  const helpers = await createSSRHelper();
  await helpers.exercise.all.prefetch();

  return (
    <>
      <NewExerciseForm />

      <HydrationBoundary state={dehydrate(helpers.queryClient)}>
        <AllExercisesTimeline />
      </HydrationBoundary>
    </>
  );
};

export default Page;
