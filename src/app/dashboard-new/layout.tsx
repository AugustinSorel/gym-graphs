import { DashboardBackground } from "@/components/ui/dashboardBackground";
import type { ComponentPropsWithoutRef, PropsWithChildren } from "react";

const Layout = (props: PropsWithChildren) => {
  return (
    <Container>
      <ContentContainer>{props.children}</ContentContainer>

      <BackgroundContainer>
        <DashboardBackground />
      </BackgroundContainer>
    </Container>
  );
};

export default Layout;

const Container = (props: ComponentPropsWithoutRef<"main">) => {
  return (
    <main
      {...props}
      className="relative min-h-[calc(100dvh-var(--header-height))] overflow-hidden"
    />
  );
};

const ContentContainer = (props: ComponentPropsWithoutRef<"div">) => {
  return (
    <div
      {...props}
      className="mx-auto flex max-w-[calc(var(--exercise-card-height)*4+20px*5)] flex-col px-5 py-10"
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
