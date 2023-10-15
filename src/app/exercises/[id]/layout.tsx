import { DashboardBackground } from "@/components/ui/dashboardBackground";
import type { ComponentProps, ReactNode } from "react";

type Props = {
  children: ReactNode;
  newExerciseDataForm: ReactNode;
  exerciseGraph: ReactNode;
  exerciseTable: ReactNode;
};

const Layout = (props: Props) => {
  return (
    <Main>
      <FormContainer>{props.newExerciseDataForm}</FormContainer>

      <ContentContainer>
        {props.exerciseGraph}
        {props.exerciseTable}
      </ContentContainer>

      {props.children}

      <BackgroundContainer>
        <DashboardBackground />
      </BackgroundContainer>
    </Main>
  );
};

export default Layout;

const Main = (props: ComponentProps<"main">) => {
  return (
    <main
      {...props}
      className="relative min-h-[calc(100dvh-var(--header-height))]"
    />
  );
};

const BackgroundContainer = (props: ComponentProps<"div">) => {
  return (
    <div
      {...props}
      className="fixed inset-0 -top-[var(--header-height)] -z-10"
    />
  );
};

const FormContainer = (props: ComponentProps<"div">) => {
  return <div {...props} className="p-10" />;
};

const ContentContainer = (props: ComponentProps<"div">) => {
  return (
    <div
      {...props}
      className="mx-auto flex max-w-[calc(var(--exercise-card-height)*4+20px*3)] flex-col gap-10  pb-5 pt-0 sm:px-5"
    />
  );
};
