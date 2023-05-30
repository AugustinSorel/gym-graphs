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

const DropDownMenu = () => {
  const [weight, setWeight] = useState<string>("kg");
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();

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
    <DropdownMenu>
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
      <DropdownMenuContent className="mr-4 w-56">
        <DropdownMenuLabel className="capitalize">settings</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {session && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <ArrowLeftRight className="mr-2 h-4 w-4" />
              <span className="capitalize">unit</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup
                  value={weight}
                  onValueChange={setWeight}
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
        )}

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

        {!session && (
          <DropdownMenuItem asChild>
            <Link href="/sign-in" className="flex w-full items-center">
              <User className="mr-2 h-4 w-4" />
              <span className="capitalize">sign in</span>
            </Link>
          </DropdownMenuItem>
        )}

        {session && (
          <DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="capitalize">
              danger zone
            </DropdownMenuLabel>
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
            <DropdownMenuItem className="text-destructive/80 focus:bg-destructive/20 focus:text-destructive">
              <Trash className="mr-2 h-4 w-4" />
              <span className="capitalize">delete account</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
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
            {session?.user?.name}
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
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={"/exercises/1"}
            className="max-w-sm truncate text-xl font-medium capitalize outline-none focus-visible:underline"
          >
            {children}
          </Link>
        </TooltipTrigger>
        <TooltipContent>
          <p className="capitalize">{children}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const Header = () => {
  const pathname = usePathname().split("/");

  const showExecisesPath = pathname[1] === "exercises";
  const showDashboardPath = pathname[1] === "dashboard" || showExecisesPath;

  return (
    <header className="sticky top-0 z-20 flex h-header items-center justify-between border-b border-border bg-primary pr-4 backdrop-blur-md">
      <nav className="flex h-full items-center overflow-hidden p-4">
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
            <CurrentExeciseLink>dead lift</CurrentExeciseLink>
          </>
        )}
      </nav>
      <DropDownMenu />
    </header>
  );
};
