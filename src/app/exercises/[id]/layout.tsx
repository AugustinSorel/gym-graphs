import { DashboardBackground } from "@/components/ui/dashboardBackground";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type Props = {
  newExerciseDataForm: ReactNode;
  exerciseDetails: ReactNode;
};

//FIXME: group the exerciseGraph and exercise table together
const Layout = (props: Props) => {
  return (
    <Main>
      <FormContainer>{props.newExerciseDataForm}</FormContainer>

      {props.exerciseDetails}

      <BackgroundContainer>
        <DashboardBackground />
      </BackgroundContainer>
    </Main>
  );
};

export default Layout;

const Main = (props: ComponentPropsWithoutRef<"main">) => {
  return (
    <main
      {...props}
      className="relative min-h-[calc(100dvh-var(--header-height))]"
    />
  );
};

const BackgroundContainer = (props: ComponentPropsWithoutRef<"div">) => {
  return (
    <div
      {...props}
      className="fixed inset-0 -top-[var(--header-height)] -z-10"
    />
  );
};

const FormContainer = (props: ComponentPropsWithoutRef<"div">) => {
  return <div {...props} className="p-10" />;
};
