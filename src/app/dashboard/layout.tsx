import { DashboardBackground } from "@/components/ui/dashboardBackground";
import type { ReactNode, ComponentProps, PropsWithChildren } from "react";
import { DashboardFiltersContextProvider } from "./dashboardFiltersContext";

type Props = {
  newExerciseForm: ReactNode;
  dashboardFilters: ReactNode;
  allExercisesGrid: ReactNode;
  exercisesByMonthGrid: ReactNode;
} & PropsWithChildren;

const Layout = (props: Props) => {
  return (
    <Container>
      <ContentContainer>
        {props.newExerciseForm}
        <DashboardFiltersContextProvider>
          {props.dashboardFilters}
          {props.allExercisesGrid}
          {props.exercisesByMonthGrid}
        </DashboardFiltersContextProvider>
      </ContentContainer>

      <BackgroundContainer>
        <DashboardBackground />
      </BackgroundContainer>

      {props.children}
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
