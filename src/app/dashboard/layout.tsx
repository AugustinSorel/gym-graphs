import { DashboardBackground } from "@/components/ui/dashboardBackground";
import type { PropsWithChildren, ReactNode } from "react";

type Props = {
  newExerciseForm: ReactNode;
  dashboardGrid: ReactNode;
} & PropsWithChildren;

const Layout = (props: Props) => {
  return (
    <main className="relative min-h-[calc(100vh-var(--header-height))]">
      <div className="space-y-5 p-5">
        {props.newExerciseForm}
        {props.dashboardGrid}
        {props.children}
      </div>

      <div className="absolute inset-0 -top-[var(--header-height)] -z-10">
        <DashboardBackground />
      </div>
    </main>
  );
};

export default Layout;
