"use client";

import { Icon } from "@/components/ui/icon";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Github,
  ChevronsUpDown,
  Check,
  Megaphone,
  Settings,
  Plus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type PropsWithChildren } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSession } from "next-auth/react";
import { useParams, usePathname } from "next/navigation";
import type { Exercise } from "@/server/db/types";
import { api } from "@/trpc/react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTeam } from "../teams/[id]/_components/useTeam";
import { useTeams } from "../teams/_components/useTeams";
import { CreateTeamDialog } from "@/components/teams/createTeamDialog";

const HomeIcon = ({ children }: PropsWithChildren) => {
  const { data: session } = useSession();

  if (session?.user.id) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            asChild
            variant="link"
            aria-label="home"
            className="h-max rounded-full p-0"
          >
            <Link href="/">{children}</Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="capitalize">home</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const Separator = () => {
  return (
    <svg
      className="max-h-[32px] min-h-[32px] min-w-[32px] max-w-[32px] stroke-foreground/50"
      viewBox="0 0 24 24"
    >
      <path d="M16.88 3.549L7.12 20.451" />
    </svg>
  );
};

const DashboardLink = () => {
  const { data: session, status } = useSession();
  const teams = useTeams();
  const params = useParams();

  if (status === "loading" || teams.isLoading) {
    return (
      <>
        <Separator />
        <Skeleton className="h-4 w-32 bg-primary" />
        <ChevronsUpDown className="ml-3 h-4 w-4 stroke-muted-foreground" />
      </>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <>
      <Separator />
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/dashboard"
              className="max-w-sm truncate text-xl font-medium capitalize outline-none focus-visible:underline"
            >
              {session?.user?.name ?? session?.user?.email?.split("@").at(0)}
            </Link>
          </TooltipTrigger>
          <TooltipContent>
            <p className="capitalize">dashboard</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DropdownMenu>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  role="combobox"
                  aria-label="change exercises"
                  className="z-10 ml-2 h-8 p-1"
                >
                  <ChevronsUpDown className="h-4 w-4 stroke-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p className="capitalize">teams</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <DropdownMenuContent className="scrollbar max-h-[400px] w-[200px] overflow-auto p-1">
          <DropdownMenuLabel className="capitalize">teams</DropdownMenuLabel>

          {!teams.data?.length && (
            <p className="text-center text-sm text-muted-foreground">0 teams</p>
          )}
          {teams.data?.map((team) => (
            <DropdownMenuItem
              asChild
              key={team.teamId}
              className="grid w-full grid-cols-[1fr_1rem] items-center gap-2 rounded-sm bg-transparent px-2 transition-colors hover:bg-primary"
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
      </DropdownMenu>
    </>
  );
};

type CurrentExerciseLinkProps = {
  selectedExerciseId: Exercise["id"];
};

const CurrentExeciseLink = ({
  selectedExerciseId,
}: CurrentExerciseLinkProps) => {
  const exercises = api.exercise.all.useQuery();

  if (exercises.isLoading) {
    return (
      <>
        <Separator />
        <Skeleton className="h-4 w-32 bg-primary" />
        <ChevronsUpDown className="ml-3 h-4 w-4 stroke-muted-foreground" />
      </>
    );
  }

  if (!exercises.data?.length) {
    return null;
  }

  return (
    <>
      <Separator />

      <span className="truncate text-xl font-medium capitalize">
        {
          exercises.data.find((exercise) => exercise.id === selectedExerciseId)
            ?.name
        }
      </span>

      <DropdownMenu>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  role="combobox"
                  aria-label="change exercises"
                  className="z-10 ml-2 h-8 p-1"
                >
                  <ChevronsUpDown className="h-4 w-4 stroke-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p className="capitalize">jump to</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <DropdownMenuContent className="scrollbar max-h-[400px] w-[200px] overflow-auto p-1">
          <DropdownMenuLabel className="capitalize">
            exercises
          </DropdownMenuLabel>

          {exercises.data.map((exercise) => (
            <DropdownMenuItem
              key={exercise.id}
              className="grid w-full grid-cols-[1fr_1rem] items-center gap-2 rounded-sm bg-transparent px-2 transition-colors hover:bg-primary"
              asChild
            >
              <Link href={`/exercises/${exercise.id}`}>
                <span className="truncate text-sm">{exercise.name}</span>
                {selectedExerciseId === exercise.id && (
                  <Check className="h-4 w-4" />
                )}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

const CurrentTeam = ({ id }: { id: string }) => {
  const team = useTeam({ id });

  if (team.isLoading) {
    return (
      <>
        <Separator />
        <Skeleton className="h-4 w-32 bg-primary" />
      </>
    );
  }

  if (!team.data) {
    return null;
  }

  return (
    <>
      <Separator />

      <span className="truncate text-xl font-medium capitalize">
        {team.data.name}
      </span>
    </>
  );
};

//TODO:error handling here
export const Header = () => {
  const session = useSession();
  const pathname = usePathname().split("/");

  const showExecisesPath = pathname[1] === "exercises";
  const showTeamPath = pathname[1] === "teams";
  const showDashboardPath =
    pathname[1] === "dashboard" ||
    pathname[1] === "account" ||
    showExecisesPath ||
    showTeamPath;

  const exerciseId = pathname[2];
  const teamId = pathname[2];

  return (
    <header className="sticky top-0 z-20 flex h-header items-center justify-between gap-2 border-b border-border bg-primary pr-4 backdrop-blur-md">
      <nav className="flex h-full w-full items-center overflow-hidden p-4">
        <HomeIcon>
          <Icon className="hover:drop-shadow-[0_0_10px_rgba(0,0,0,0.5)] dark:hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.75)]" />
        </HomeIcon>

        {showDashboardPath && <DashboardLink />}

        {showExecisesPath && exerciseId && (
          <CurrentExeciseLink selectedExerciseId={exerciseId} />
        )}

        {showTeamPath && teamId && <CurrentTeam id={teamId} />}
      </nav>

      {session.status === "authenticated" && (
        <>
          <FeatureRequest />
          <SettingsLink />
        </>
      )}
    </header>
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
    <DropdownMenu>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button size="icon" aria-label="menu" variant="ghost">
                <Megaphone className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p className="capitalize">feature request</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DropdownMenuContent className="mr-4 w-56">
        <DropdownMenuLabel className="first-letter:capitalize">
          request a new feature
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link
            href="https://github.com/AugustinSorel/gym-graphs/issues"
            className="flex items-center gap-2"
            target="_blank"
          >
            <Github className="h-4 w-4" />
            <span className="capitalize">github</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
