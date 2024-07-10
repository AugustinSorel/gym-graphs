import type { ComponentPropsWithoutRef } from "react";
import { NewExerciseDataForm } from "./_newExerciseDataForm/newExerciseDataForm";
import { HydrateClient, api } from "@/trpc/server";
import { redirect } from "next/navigation";

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

  await api.exercise.get.prefetch({ id: params.data.id });

  return (
    <>
      <FormContainer>
        <NewExerciseDataForm />
      </FormContainer>

      <HydrateClient>
        <Content />
      </HydrateClient>
    </>
  );
};

export default Page;

const FormContainer = (props: ComponentPropsWithoutRef<"div">) => {
  return <div {...props} className="p-10" />;
};
