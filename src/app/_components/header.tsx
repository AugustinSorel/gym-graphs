import { getServerAuthSession } from "@/server/auth";
import { Breadcrumb, BreadcrumbList } from "@/components/ui/breadcrumb";
import { ExercisesBreadcrumb } from "./exericseBreadcrumb";
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
import { TeamBreadcrumb } from "./teamBreadCrumb";
import type { ComponentPropsWithoutRef } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Megaphone, Settings } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HydrateClient, api } from "@/trpc/server";

export const Header = async () => {
  const session = await getServerAuthSession();

  void api.exercise.all.prefetch();
  void api.team.all.prefetch();
  void api.user.get.prefetch();

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
              <HydrateClient>
                <DashboardBreadcrumb />
              </HydrateClient>
            </DropdownMenu>
          </DashboardLinkGuard>

          <ExerciseLinkGuard>
            <DropdownMenu>
              <HydrateClient>
                <ExercisesBreadcrumb />
              </HydrateClient>
            </DropdownMenu>
          </ExerciseLinkGuard>

          <TeamLinkGuard>
            <HydrateClient>
              <TeamBreadcrumb />
            </HydrateClient>
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
