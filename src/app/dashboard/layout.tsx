import { DashboardBackground } from "@/components/ui/dashboardBackground";
import type { HTMLAttributes, ReactNode } from "react";

type Props = {
  newExerciseForm: ReactNode;
  allExercisesGrid: ReactNode;
  exercisesByMonthGrid: ReactNode;
};

const Layout = (props: Props) => {
  return (
    <Container>
      <Body>
        {props.newExerciseForm}
        {props.allExercisesGrid}
        {props.exercisesByMonthGrid}
      </Body>

      <BackgroundContainer>
        <DashboardBackground />
      </BackgroundContainer>
    </Container>
  );
};

export default Layout;

const Container = (props: HTMLAttributes<HTMLElement>) => {
  return (
    <main
      {...props}
      className="relative min-h-[calc(100dvh-var(--header-height))] overflow-hidden"
    />
  );
};

const Body = (props: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      {...props}
      className="mx-auto flex max-w-[calc(var(--exercise-card-height)*4+20px*5)] flex-col gap-5 p-5"
    />
  );
};

const BackgroundContainer = (props: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      {...props}
      className="fixed inset-0 -top-[var(--header-height)] -z-10"
    />
  );
};
