import { DashboardBackground } from "@/components/ui/dashboardBackground";
import type { PropsWithChildren } from "react";

const Layout = ({ children }: PropsWithChildren) => {
  return (
    <main className="relative min-h-[calc(100vh-var(--header-height))]">
      {children}
      <div className="absolute inset-0 -top-[var(--header-height)] -z-10">
        <DashboardBackground />
      </div>
    </main>
  );
};

export default Layout;
