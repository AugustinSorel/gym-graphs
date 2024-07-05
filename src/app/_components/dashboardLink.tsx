"use client";

import { BreadcrumbItem, BreadcrumbLink } from "@/components/ui/breadcrumb";
import { getUserDisplayName } from "@/lib/utils";
import type { User } from "next-auth";
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

export const DashboardLinkItem = (props: Partial<{ user: User }>) => {
  if (!props.user) {
    return null;
  }

  const username = getUserDisplayName(props.user);

  return (
    <BreadcrumbItem>
      <BreadcrumbLink href="/dashboard">{username}</BreadcrumbLink>
    </BreadcrumbItem>
  );
};
