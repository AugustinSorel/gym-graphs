import { DashboardBackground } from "@/components/ui/dashboardBackground";
import type { ReactNode, ComponentProps } from "react";

type Props = {
  newExerciseForm: ReactNode;
  allExercisesGrid: ReactNode;
  exercisesByMonthGrid: ReactNode;
};

const Layout = (props: Props) => {
  return (
    <Container>
      <ContentContainer>
        {props.newExerciseForm}
        {props.allExercisesGrid}
        {props.exercisesByMonthGrid}
      </ContentContainer>

      <BackgroundContainer>
        <DashboardBackground />
      </BackgroundContainer>
    </Container>
  );
};

export default Layout;

const Container = (props: ComponentProps<"main">) => {
  return (
    <main
      {...props}
      className="relative min-h-[calc(100dvh-var(--header-height))] overflow-hidden"
    />
  );
};

const ContentContainer = (props: ComponentProps<"div">) => {
  return (
    <div
      {...props}
      className="mx-auto flex max-w-[calc(var(--exercise-card-height)*4+20px*5)] flex-col px-5 py-10"
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
