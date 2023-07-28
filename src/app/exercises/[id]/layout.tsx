import { DashboardBackground } from "@/components/ui/dashboardBackground";
import type { PropsWithChildren, ReactNode } from "react";

type Props = {
  newExerciseDataForm: ReactNode;
} & PropsWithChildren;

const Layout = (props: Props) => {
  return (
    <main className="relative min-h-[calc(100dvh-var(--header-height))]">
      <div className="space-y-5 p-5">{props.newExerciseDataForm}</div>

      {props.children}

      <div className="fixed inset-0 -top-[var(--header-height)] -z-10">
        <DashboardBackground />
      </div>
    </main>
  );
};

export default Layout;
