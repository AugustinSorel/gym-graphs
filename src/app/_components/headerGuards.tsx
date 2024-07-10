"use client";

import { usePathname } from "next/navigation";
import type { PropsWithChildren } from "react";

export const DashboardLinkGuard = (props: PropsWithChildren) => {
  const pathName = usePathname();
  const routes = ["/dashboard", "/teams", "/account", "/exercises"];

  const canShowRoute = routes.some((route) => pathName.startsWith(route));

  if (!canShowRoute) {
    return null;
  }

  return <>{props.children}</>;
};

export const ExerciseLinkGuard = (props: PropsWithChildren) => {
  const pathName = usePathname();
  const routes = ["/exercises"];

  const canShowRoute = routes.some((route) => pathName.startsWith(route));

  if (!canShowRoute) {
    return null;
  }

  return <>{props.children}</>;
};

export const TeamLinkGuard = (props: PropsWithChildren) => {
  const pathName = usePathname();
  const routes = ["/teams"];

  const canShowRoute = routes.some((route) => pathName.startsWith(route));

  if (!canShowRoute) {
    return null;
  }

  return <>{props.children}</>;
};
