"use client";

import {
  BreadcrumbErrorFallBack,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbSkeleton,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getUserDisplayName } from "@/lib/utils";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { Check, ChevronDownIcon, Plus } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import Link from "next/link";
import { CreateTeamDialog } from "@/components/teams/createTeamDialog";
import { useParams } from "next/navigation";
import { useTeams } from "../teams/_components/useTeams";
import { useUser } from "../account/_components/useUser";

export const DashboardBreadcrumb = () => {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          fallback={
            <>
              <BreadcrumbSeparator className="text-destructive" />
              <BreadcrumbErrorFallBack />
              <ChevronDownIcon className="h-4 w-4 text-destructive" />
            </>
          }
          onReset={reset}
        >
          <Suspense
            fallback={
              <>
                <BreadcrumbSeparator />
                <BreadcrumbSkeleton />
                <ChevronDownIcon className="h-4 w-4" />
              </>
            }
          >
            <Content />
          </Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
};

const Content = () => {
  const [teams] = useTeams();
  const [user] = useUser();
  const params = useParams();

  return (
    <>
      <BreadcrumbSeparator />

      <BreadcrumbItem className="max-w-xs truncate">
        <BreadcrumbLink className="truncate" asChild>
          <Link href="/dashboard">{getUserDisplayName(user)}</Link>
        </BreadcrumbLink>
      </BreadcrumbItem>

      <DropdownMenuTrigger className="flex items-center gap-1">
        <ChevronDownIcon className="h-4 w-4" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="scrollbar max-h-[400px] w-[200px] overflow-auto p-1"
      >
        {!teams.length && (
          <p className="text-center text-sm text-muted-foreground">0 teams</p>
        )}

        {teams.map((team) => (
          <DropdownMenuItem
            key={team.teamId}
            className="grid w-full grid-cols-[1fr_1rem] items-center gap-2 rounded-sm bg-transparent px-2 transition-colors hover:bg-primary"
            asChild
          >
            <Link href={`/teams/${team.teamId}`}>
              <span className="truncate text-sm">{team.team.name}</span>
              {params.id === team.teamId && <Check className="h-4 w-4" />}
            </Link>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <CreateTeamDialog>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <Plus className="mr-2 h-4 w-4" />
            <span className="first-letter:capitalize">create a team</span>
          </DropdownMenuItem>
        </CreateTeamDialog>
      </DropdownMenuContent>
    </>
  );
};
