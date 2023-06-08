import { DashboardBackground } from "@/components/ui/dashboardBackground";
import type { ReactNode } from "react";

type Props = {
  newExerciseDataForm: ReactNode;
};

const Layout = (props: Props) => {
  return (
    <main className="relative min-h-[calc(100vh-var(--header-height))]">
      <div className="space-y-5 p-5">{props.newExerciseDataForm}</div>

      <div className="absolute inset-0 -top-[var(--header-height)] -z-10">
        <DashboardBackground />
      </div>
    </main>
  );
};

export default Layout;
