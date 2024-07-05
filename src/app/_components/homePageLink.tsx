import { BreadcrumbItem, BreadcrumbLink } from "@/components/ui/breadcrumb";
import { Icon } from "@/components/ui/icon";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { User } from "next-auth";

export const HomePageLinkItem = (props: Partial<{ user: User }>) => {
  if (!props.user) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">
                <Icon
                  size="sm"
                  className="hover:drop-shadow-[0_0_10px_rgba(0,0,0,0.5)] dark:hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.75)]"
                />
              </BreadcrumbLink>
            </BreadcrumbItem>
          </TooltipTrigger>
          <TooltipContent>
            <p className="capitalize">home</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <BreadcrumbItem>
      <Icon size="sm" />
    </BreadcrumbItem>
  );
};
