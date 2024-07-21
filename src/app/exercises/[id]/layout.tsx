import { DashboardBackground } from "@/components/ui/dashboardBackground";
import type { ComponentPropsWithoutRef, PropsWithChildren } from "react";

const Layout = (props: PropsWithChildren) => {
  return (
    <Main>
      {props.children}

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
