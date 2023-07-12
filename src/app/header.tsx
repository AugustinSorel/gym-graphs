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
import { useState } from "react";
import type { PropsWithChildren } from "react";
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
import { useToast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";
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
import { useWeightUnit } from "@/store/weightUnit";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getExercises } from "@/fakeData";

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
            <DropdownMenuRadioItem value="lbs" className="capitalize">
              lbs
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
  const [isSignOutLoading, setIsSignOutLoading] = useState(false);
  const { toast } = useToast();

  const signOutHandler = async () => {
    try {
      setIsSignOutLoading(() => true);
      await signOut({ callbackUrl: "/" });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "We could not sign you out,",
        action: (
          <ToastAction
            altText="Try again"
            onClick={() => void signOutHandler()}
          >
            Try again
          </ToastAction>
        ),
      });
    } finally {
      setIsSignOutLoading(() => false);
    }
  };

  return (
    <DropdownMenuItem
      className="space-x-2"
      onClick={(e) => {
        e.preventDefault();
        void signOutHandler();
      }}
    >
      {isSignOutLoading && <Loader />}
      <LogOut className="h-4 w-4" />
      <span className="capitalize">sign out</span>
    </DropdownMenuItem>
  );
};

const DeleteAccountDropDownItem = () => {
  const [isDeleteAccountLoading, setIsDeleteAccountLoading] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const { toast } = useToast();

  const deleteHandler = async () => {
    try {
      setIsDeleteAccountLoading(() => true);
      await new Promise((res) => setTimeout(res, 1_000));
      setIsAlertOpen(() => false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "We could not delete your account",
        action: (
          <ToastAction altText="Try again" onClick={() => void deleteHandler()}>
            Try again
          </ToastAction>
        ),
      });
    } finally {
      setIsDeleteAccountLoading(() => false);
    }
  };

  return (
    <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
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
              void deleteHandler();
            }}
          >
            {isDeleteAccountLoading && <Loader />}
            <span className="capitalize">delete</span>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

const HomeIcon = () => {
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
            <Link href="/">
              <Icon className="hover:drop-shadow-[0_0_10px_rgba(0,0,0,0.5)] dark:hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.75)]" />
            </Link>
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
  const { data: session } = useSession();

  return (
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
  );
};

const CurrentExeciseLink = ({ children }: PropsWithChildren) => {
  const [open, setOpen] = useState(false);
  const exercises = getExercises();

  const [exerciseIdSelected, setExerciseIdSelected] = useState(
    exercises.find((exercise) => exercise.name === children?.toString())?.id
  );

  const selectHandler = (exerciseId: typeof exerciseIdSelected) => {
    setExerciseIdSelected(exerciseId);
    setOpen(() => false);
  };

  return (
    <>
      <span className="truncate text-xl font-medium capitalize">
        {children}
      </span>
      <Popover open={open} onOpenChange={setOpen}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  role="combobox"
                  aria-expanded={open}
                  aria-label="change exercises"
                  className="z-10 ml-2 h-8 p-1"
                >
                  <ChevronsUpDown className="h-4 w-4 stroke-muted-foreground" />
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p className="capitalize">jump to</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <PopoverContent className="scrollbar max-h-[400px] w-[200px] overflow-auto p-1">
          <h2 className="p-2 text-xs font-semibold capitalize text-muted-foreground">
            exercises
          </h2>

          {exercises.map((exercise) => (
            <Button
              variant="secondary"
              size="sm"
              className="grid w-full grid-cols-[1fr_1rem] items-center gap-2 rounded-sm bg-transparent px-2 transition-colors hover:bg-primary"
              key={exercise.id}
              onClick={() => selectHandler(exercise.id)}
              asChild
            >
              <Link href={`/exercises/${exercise.name}`}>
                <span className="truncate text-sm">{exercise.name}</span>
                {exerciseIdSelected === exercise.id && (
                  <Check className="h-4 w-4" />
                )}
              </Link>
            </Button>
          ))}
        </PopoverContent>
      </Popover>
    </>
  );
};

export const Header = () => {
  const pathname = usePathname().split("/");

  const showExecisesPath = pathname[1] === "exercises";
  const showDashboardPath = pathname[1] === "dashboard" || showExecisesPath;

  return (
    <header className="sticky top-0 z-20 flex h-header items-center justify-between border-b border-border bg-primary pr-4 backdrop-blur-md">
      <nav className="flex h-full w-full items-center overflow-hidden p-4">
        <HomeIcon />

        {showDashboardPath && (
          <>
            <Separator />
            <DashboardLink />
          </>
        )}

        {showExecisesPath && (
          <>
            <Separator />
            <CurrentExeciseLink>
              {pathname[2]?.replace(/%20/g, " ")}
            </CurrentExeciseLink>
          </>
        )}
      </nav>
      <DropDownMenu />
    </header>
  );
};
