import type { ComponentPropsWithoutRef } from "react";
import { NewExerciseDataForm } from "./_newExerciseDataForm/newExerciseDataForm";
import { createSSRHelper } from "@/trpc/server";
import { redirect } from "next/navigation";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import {
  type ExercisePageParams,
  exercisePageParamsSchema,
} from "./_components/exercisePageParams";
import {
  type ExercisePageSearchParams,
  exercisePageSearchParamsSchema,
} from "./_components/exercisePageSearchParams";
import { Content } from "./content";

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
        <Content />
      </HydrationBoundary>
    </>
  );
};

export default Page;

const FormContainer = (props: ComponentPropsWithoutRef<"div">) => {
  return <div {...props} className="p-10" />;
};
