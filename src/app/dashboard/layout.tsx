import { DashboardBackground } from "@/components/ui/dashboardBackground";
import type { ReactNode } from "react";

type Props = {
  newExerciseForm: ReactNode;
  dashboardGrid: ReactNode;
};

const Layout = (props: Props) => {
  return (
    <main className="relative min-h-[calc(100vh-var(--header-height))]">
      <div className="flex flex-col gap-5 p-5">
        {props.newExerciseForm}
        {props.dashboardGrid}
      </div>

      <div className="absolute inset-0 -top-[var(--header-height)] -z-10">
        <DashboardBackground />
      </div>
    </main>
  );
};

export default Layout;
