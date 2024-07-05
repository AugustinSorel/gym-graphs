import { getServerAuthSession } from "@/server/auth";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { DashboardLinkGuard, DashboardLinkItem } from "./dashboardLink";
import { ExerciseLinkGuard, ExerciseLinkItem } from "./exericseLink";
import { createSSRHelper } from "@/trpc/server";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { HomePageLinkItem } from "./homePageLink";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDownIcon } from "lucide-react";

export const Header = async () => {
  const session = await getServerAuthSession();

  const helpers = await createSSRHelper();
  await helpers.exercise.all.prefetch();

  return (
    <header className="sticky top-0 z-20 flex h-header items-center justify-between gap-2 border-b border-border bg-primary pr-4 backdrop-blur-md">
      <Breadcrumb className="flex h-full w-full items-center overflow-hidden p-4">
        <BreadcrumbList>
          <HomePageLinkItem user={session?.user} />

          <DashboardLinkGuard>
            <BreadcrumbSeparator />
            <DashboardLinkItem user={session?.user} />
          </DashboardLinkGuard>

          <DropdownMenu>
            <BreadcrumbSeparator />
            <DropdownMenuTrigger className="flex items-center gap-1">
              <HydrationBoundary state={dehydrate(helpers.queryClient)}>
                <ExerciseLinkGuard>
                  <ExerciseLinkItem />
                </ExerciseLinkGuard>
              </HydrationBoundary>
              <ChevronDownIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem>Documentation</DropdownMenuItem>
              <DropdownMenuItem>Themes</DropdownMenuItem>
              <DropdownMenuItem>GitHub</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
};
