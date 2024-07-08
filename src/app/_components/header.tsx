import { getServerAuthSession } from "@/server/auth";
import { Breadcrumb, BreadcrumbList } from "@/components/ui/breadcrumb";
import { ExercisesBreadcrumb } from "./exericseBreadcrumb";
import { createSSRHelper } from "@/trpc/server";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import {
  GymGraphsIconBreadcrumb,
  HomePageBreadcrumb,
} from "./homepageBreadcrumb";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import {
  DashboardLinkGuard,
  ExerciseLinkGuard,
  TeamLinkGuard,
} from "./headerGuards";
import { DashboardBreadcrumb } from "./dashboardBreadCrumb";
import { AuthProvider } from "./providers";
import { TeamBreadcrumb } from "./teamBreadCrumb";
import { ComponentPropsWithoutRef } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Megaphone, Settings } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const Header = async () => {
  const session = await getServerAuthSession();

  const helpers = await createSSRHelper();

  await helpers.exercise.all.prefetch();
  await helpers.team.all.prefetch();

  if (!session?.user) {
    return (
      <Container>
        <Breadcrumb className="p-4">
          <BreadcrumbList>
            <HomePageBreadcrumb />
          </BreadcrumbList>
        </Breadcrumb>
      </Container>
    );
  }

  return (
    <Container>
      <Breadcrumb className="flex h-full w-full items-center overflow-hidden p-4">
        <BreadcrumbList className="min-w-0 flex-nowrap">
          <GymGraphsIconBreadcrumb />

          <DashboardLinkGuard>
            <DropdownMenu>
              <HydrationBoundary state={dehydrate(helpers.queryClient)}>
                <AuthProvider session={session}>
                  <DashboardBreadcrumb />
                </AuthProvider>
              </HydrationBoundary>
            </DropdownMenu>
          </DashboardLinkGuard>

          <ExerciseLinkGuard>
            <DropdownMenu>
              <HydrationBoundary state={dehydrate(helpers.queryClient)}>
                <ExercisesBreadcrumb />
              </HydrationBoundary>
            </DropdownMenu>
          </ExerciseLinkGuard>

          <TeamLinkGuard>
            <HydrationBoundary state={dehydrate(helpers.queryClient)}>
              <TeamBreadcrumb />
            </HydrationBoundary>
          </TeamLinkGuard>
        </BreadcrumbList>
      </Breadcrumb>

      <FeatureRequest />
      <SettingsLink />
    </Container>
  );
};

const Container = (props: ComponentPropsWithoutRef<"header">) => {
  return (
    <header
      className="sticky top-0 z-20 flex h-header items-center justify-between gap-2 border-b border-border bg-primary pr-4 backdrop-blur-md"
      {...props}
    />
  );
};

const SettingsLink = () => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" aria-label="menu" variant="ghost" asChild>
            <Link href="/account">
              <Settings className="h-4 w-4" />
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="capitalize">settings</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const FeatureRequest = () => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" aria-label="menu" variant="ghost" asChild>
            <Link
              href="https://github.com/AugustinSorel/gym-graphs/issues"
              target="_blank"
            >
              <Megaphone className="h-4 w-4" />
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="capitalize">feature request</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
