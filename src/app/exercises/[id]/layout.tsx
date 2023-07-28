import { DashboardBackground } from "@/components/ui/dashboardBackground";
import type { ComponentProps, PropsWithChildren, ReactNode } from "react";

type Props = {
  newExerciseDataForm: ReactNode;
} & PropsWithChildren;

const Layout = (props: Props) => {
  return (
    <Main>
      <FormContainer>{props.newExerciseDataForm}</FormContainer>

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

const FormContainer = (props: ComponentProps<"div">) => {
  return <div {...props} className="space-y-5 p-5" />;
};

const BackgroundContainer = (props: ComponentProps<"div">) => {
  return (
    <div
      {...props}
      className="fixed inset-0 -top-[var(--header-height)] -z-10"
    />
  );
};
