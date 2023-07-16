import { DashboardBackground } from "@/components/ui/dashboardBackground";
import type { HTMLAttributes, ReactNode } from "react";

type Props = {
  newExerciseForm: ReactNode;
  dashboardGrid: ReactNode;
};

const Layout = (props: Props) => {
  return (
    <Container>
      <Body>
        {props.newExerciseForm}
        {props.dashboardGrid}
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
      className="relative min-h-[calc(100dvh-var(--header-height))]"
    />
  );
};

const Body = (props: HTMLAttributes<HTMLDivElement>) => {
  return <div {...props} className="flex flex-col gap-5 p-5" />;
};

const BackgroundContainer = (props: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      {...props}
      className="absolute inset-0 -top-[var(--header-height)] -z-10"
    />
  );
};
