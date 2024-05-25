import type { ComponentPropsWithoutRef } from "react";
import { NewExerciseDataForm } from "./_newExerciseDataForm/newExerciseDataForm";
import { createSSRHelper } from "@/trpc/server";
import { redirect } from "next/navigation";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { ExerciseDataGraphCard } from "./_exerciseDataGraphCard/exerciseDataGraphCard";
import {
  type ExercisePageParams,
  exercisePageParamsSchema,
} from "./_components/exercisePageParams";
import { ExerciseDataTableCard } from "./_exerciseDataTableCard/exerciseDataTableCard";
import {
  type ExercisePageSearchParams,
  exercisePageSearchParamsSchema,
} from "./_components/exercisePageSearchParams";
import { ExercisePageContextProvider } from "./_components/exercisePageContext";

type Props = {
  params: ExercisePageParams;
  searchParams: ExercisePageSearchParams;
};

const Page = async (unsafeProps: Props) => {
  const params = exercisePageParamsSchema.safeParse(unsafeProps.params);
  const searchParams = exercisePageSearchParamsSchema.safeParse(
    unsafeProps.searchParams,
  );

  if (!params.success || !searchParams.success) {
    return redirect("/dashboard");
  }

  const helpers = await createSSRHelper();
  await helpers.exercise.get.prefetch({ id: params.data.id });

  return (
    <>
      <FormContainer>
        <NewExerciseDataForm />
      </FormContainer>

      <HydrationBoundary state={dehydrate(helpers.queryClient)}>
        <ExercisePageContextProvider>
          <ContentContainer>
            <ExerciseDataGraphCard />
            <ExerciseDataTableCard />
          </ContentContainer>
        </ExercisePageContextProvider>
      </HydrationBoundary>
    </>
  );
};

export default Page;

const FormContainer = (props: ComponentPropsWithoutRef<"div">) => {
  return <div {...props} className="p-10" />;
};

const ContentContainer = (props: ComponentPropsWithoutRef<"div">) => {
  return (
    <div
      {...props}
      className="mx-auto flex max-w-[calc(var(--exercise-card-height)*4+20px*3)] flex-col gap-10  pb-5 pt-0 sm:px-5"
    />
  );
};
