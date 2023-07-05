import { DashboardBackground } from "@/components/ui/dashboardBackground";
import type { ReactNode } from "react";

type Props = {
  newExerciseForm: ReactNode;
  exerciseCard: ReactNode;
};

//TODO: mock data
const Layout = (props: Props) => {
  return (
    <main className="relative min-h-[calc(100vh-var(--header-height))]">
      <div className="space-y-5 p-5">
        {props.newExerciseForm}

        <ul className="mx-auto grid max-w-[calc(var(--exercise-card-height)*4+20px*3)] grid-cols-[repeat(auto-fill,minmax(min(100%,var(--exercise-card-height)),1fr))] gap-5">
          {[...Array<unknown>(10)].map(() => props.exerciseCard)}
        </ul>
      </div>

      <div className="absolute inset-0 -top-[var(--header-height)] -z-10">
        <DashboardBackground />
      </div>
    </main>
  );
};

export default Layout;
