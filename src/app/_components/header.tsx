"use client";

import { Icon } from "@/components/ui/icon";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowLeftRight,
  Menu,
  Palette,
  Github,
  User,
  Trash,
  LogOut,
  ChevronsUpDown,
  Check,
  Megaphone,
  Plus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, type PropsWithChildren } from "react";
import { useTheme } from "next-themes";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { signOut, useSession } from "next-auth/react";
import { Loader } from "@/components/ui/loader";
import { usePathname } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useWeightUnit } from "@/context/weightUnit";
import type { Exercise } from "@/server/db/types";
import { type RouterOutputs, api } from "@/trpc/react";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { teamSchema } from "@/schemas/team.schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";

const DropDownMenu = () => {
  const { data: session } = useSession();

  return (
    <DropdownMenu>
      <MenuIcon />

      <DropdownMenuContent className="mr-4 w-56">
        <DropdownMenuLabel className="capitalize">settings</DropdownMenuLabel>

        <DropdownMenuSeparator />

        {session && <WeightDropDownItem />}

        <ThemeDropDownItem />

        <GitHubDropDownitem />

        {!session && <SignInDropDownItem />}

        {session && (
          <DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="capitalize">
              danger zone
            </DropdownMenuLabel>

            <SignOutDropDownItem />

            <DeleteAccountDropDownItem />
          </DropdownMenuGroup>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const MenuIcon = () => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button size="icon" aria-label="menu">
              <Menu className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p className="capitalize">menu</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const WeightDropDownItem = () => {
  const weightUnit = useWeightUnit();

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <ArrowLeftRight className="mr-2 h-4 w-4" />
        <span className="capitalize">unit - ({weightUnit.get})</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent>
          <DropdownMenuRadioGroup
            value={weightUnit.get}
            onValueChange={(e) =>
              weightUnit.set(e as Parameters<typeof weightUnit.set>[0])
            }
          >
            <DropdownMenuRadioItem value="kg" className="capitalize">
              kg
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="lb" className="capitalize">
              lb
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
};

const ThemeDropDownItem = () => {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Palette className="mr-2 h-4 w-4" />
        <span className="capitalize">theme</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent>
          <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
            <DropdownMenuRadioItem value="light" className="capitalize">
              light
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark" className="capitalize">
              dark
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="system" className="capitalize">
              system
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
};

const GitHubDropDownitem = () => {
  return (
    <DropdownMenuItem asChild>
      <Link
        href="https://github.com/augustinsorel/gym-graphs"
        target="_blank"
        className="flex w-full items-center"
      >
        <Github className="mr-2 h-4 w-4" />
        <span className="capitalize">gitHub</span>
      </Link>
    </DropdownMenuItem>
  );
};

const SignInDropDownItem = () => {
  return (
    <DropdownMenuItem asChild>
      <Link href="/sign-in" className="flex w-full items-center">
        <User className="mr-2 h-4 w-4" />
        <span className="capitalize">sign in</span>
      </Link>
    </DropdownMenuItem>
  );
};

const SignOutDropDownItem = () => {
  const signOutMutation = useMutation({
    mutationFn: async () => {
      return signOut({ callbackUrl: "/" });
    },
  });

  return (
    <DropdownMenuItem
      className="space-x-2"
      onClick={(e) => {
        e.preventDefault();
        signOutMutation.mutate();
      }}
    >
      {signOutMutation.isPending && <Loader />}
      <LogOut className="h-4 w-4" />
      <span className="capitalize">sign out</span>
    </DropdownMenuItem>
  );
};

const DeleteAccountDropDownItem = () => {
  const deleteAccount = api.user.delete.useMutation({
    onSuccess: async () => {
      await signOut({ callbackUrl: "/" });
    },
  });

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem
          className="text-destructive/80 focus:bg-destructive/20 focus:text-destructive"
          onSelect={(e) => e.preventDefault()}
        >
          <Trash className="mr-2 h-4 w-4" />
          <span className="capitalize">delete account</span>
        </DropdownMenuItem>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your
            account and remove your data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="capitalize">cancel</AlertDialogCancel>
          <AlertDialogAction
            className="space-x-2 bg-destructive text-destructive-foreground hover:bg-destructive/80"
            onClick={(e) => {
              e.preventDefault();
              void deleteAccount.mutate();
            }}
          >
            {deleteAccount.isPending && <Loader />}
            <span className="capitalize">delete</span>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

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
  const teams = api.team.all.useQuery();

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
            <DropdownMenuItem asChild key={team.teamId}>
              <Link href={`/teams/${team.teamId}`}>
                <span className="truncate text-sm">{team.team.name}</span>
              </Link>
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />

          <CreateTeamDialog />
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
  const team = api.team.get.useQuery({ id });

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

export const Header = () => {
  const pathname = usePathname().split("/");

  const showExecisesPath = pathname[1] === "exercises";
  const showTeamPath = pathname[1] === "teams";
  const showDashboardPath =
    pathname[1] === "dashboard" || showExecisesPath || showTeamPath;

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
      <FeatureRequest />
      <DropDownMenu />
    </header>
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

const CreateTeamDialog = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const formSchema = teamSchema.pick({ name: true });
  const utils = api.useUtils();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "" },
  });

  const createTeam = api.team.create.useMutation({
    onSuccess: () => {
      setIsDialogOpen(false);
    },
    onMutate: (variables) => {
      const teams = utils.team.all.getData();

      if (!teams) {
        return;
      }

      const optimisticTeam: RouterOutputs["team"]["all"][number] = {
        memberId: Math.random().toString(),
        teamId: Math.random().toString(),
        team: {
          id: Math.random().toString(),
          authorId: Math.random().toString(),
          name: variables.name,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      utils.team.all.setData(undefined, [...teams, optimisticTeam]);
    },
    onSettled: () => {
      void utils.team.all.invalidate();
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createTeam.mutate(values);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <Plus className="mr-2 h-4 w-4" />
          <span className="first-letter:capitalize">create a team</span>
        </DropdownMenuItem>
      </DialogTrigger>

      <DialogContent className="space-y-5 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="first-letter:capitalize">
            create a team
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>team name</FormLabel>
                  <FormControl>
                    <Input placeholder="friends" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={createTeam.isPending}
              className="ml-auto"
            >
              {createTeam.isPending && <Loader className="mr-2" />}
              <span className="capitalize">save</span>
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
