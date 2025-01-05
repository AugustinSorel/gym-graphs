import { signOutAction } from "~/auth/auth.actions";
import { ComponentProps, useState, useTransition } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { Button } from "~/ui/button";
import { Spinner } from "~/ui/spinner";
import {
  LogOut,
  Settings,
  User2,
  Github,
  Laptop,
  Sun,
  Moon,
  Menu,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/ui/dropdown-menu";
import { useUser } from "~/context/user.context";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/ui/sheet";
import { AppIcon } from "~/ui/app-icon";
import { cn } from "~/styles/styles.utils";

export const Header = () => {
  return (
    <>
      <MobileHeader />
      <DesktopHeader />
    </>
  );
};

const MobileHeader = () => {
  return (
    <Container className="lg:hidden">
      <AppIcon />
      <Title>gym graphs</Title>
      <MobileNav />
    </Container>
  );
};

const DesktopHeader = () => {
  return (
    <Container className="hidden lg:flex">
      <DesktopNav />
      <UserProfileDropdown />
    </Container>
  );
};

const DesktopNav = () => {
  return (
    <Nav className="flex h-full gap-10">
      <Link
        className="relative flex items-center font-bold capitalize text-muted-foreground transition-colors after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:translate-y-1/2 after:bg-primary after:opacity-0 after:transition-opacity hover:text-foreground hover:after:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[status=active]:text-foreground data-[status=active]:after:opacity-100"
        to="/dashboard"
      >
        dashbaord
      </Link>
      <Link
        className="relative flex items-center font-bold capitalize text-muted-foreground transition-colors after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:translate-y-1/2 after:bg-primary after:opacity-0 after:transition-opacity hover:text-foreground hover:after:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[status=active]:text-foreground data-[status=active]:after:opacity-100"
        to="/settings"
      >
        settings
      </Link>
    </Nav>
  );
};

const MobileNav = () => {
  const [isOpen, setIsOpen] = useState(false);
  const signOut = useSignOut();

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetHeader className="sr-only">
        <SheetTitle>menu</SheetTitle>
        <SheetDescription>navigation menu</SheetDescription>
      </SheetHeader>

      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="ml-auto">
          <Menu className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-lg">
        <Nav className="mt-10 grid gap-10">
          <Link
            className="text-xl font-semibold capitalize text-muted-foreground transition-colors hover:text-foreground data-[status=active]:text-foreground"
            to="/dashboard"
            onClick={() => {
              setIsOpen(false);
            }}
          >
            dashbaord
          </Link>
          <Link
            className="text-xl font-semibold capitalize text-muted-foreground transition-colors hover:text-foreground data-[status=active]:text-foreground"
            to="/settings"
            onClick={() => {
              setIsOpen(false);
            }}
          >
            settings
          </Link>
          <Button
            className="justify-start p-0 text-xl font-semibold capitalize text-muted-foreground transition-colors hover:text-foreground hover:no-underline data-[status=active]:text-foreground"
            disabled={signOut.isPending}
            variant="link"
            onClick={() => {
              signOut.mutate(undefined);
            }}
          >
            <span>sign out</span>
            {signOut.isPending && <Spinner />}
          </Button>
        </Nav>
      </SheetContent>
    </Sheet>
  );
};

const UserProfileDropdown = () => {
  const user = useUser();
  const signOut = useSignOut();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="ml-auto">
          <User2 className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72" align="end">
        <hgroup className="m-2 p-2">
          <h1 className="truncate font-semibold">{user.name}</h1>
          <p className="font-muted-foreground truncate text-sm">{user.email}</p>
        </hgroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="m-2 justify-between px-4 py-2">
          <Link to="/settings">
            <span>settings</span>
            <Settings className="size-4" />
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="m-2 justify-between px-4 py-2">
          <a href="https://github.com/augustinsorel/gym-graphs" target="_blank">
            <span>github</span>
            <Github className="size-4" />
          </a>
        </DropdownMenuItem>
        <DropdownMenuGroup className="m-2 flex items-center justify-between gap-2 px-4 py-2">
          <p className="text-sm">theme</p>
          <DropdownMenuRadioGroup
            className="flex gap-2"
            // value={theme.theme}
            // onValueChange={theme.setTheme}
          >
            <DropdownMenuRadioItem
              value="system"
              className="flex cursor-pointer items-center justify-center rounded-md border p-1.5 outline-none transition-colors focus:bg-accent disabled:pointer-events-none disabled:opacity-50 aria-checked:bg-accent"
              onSelect={(e) => e.preventDefault()}
            >
              <Laptop className="size-4" />
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem
              value="light"
              className="flex cursor-pointer items-center justify-center rounded-md border p-1.5 outline-none transition-colors focus:bg-accent disabled:pointer-events-none disabled:opacity-50 aria-checked:bg-accent"
              onSelect={(e) => e.preventDefault()}
            >
              <Sun className="size-4" />
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem
              value="dark"
              className="flex cursor-pointer items-center justify-center rounded-md border p-1.5 outline-none transition-colors focus:bg-accent disabled:pointer-events-none disabled:opacity-50 aria-checked:bg-accent"
              onSelect={(e) => e.preventDefault()}
            >
              <Moon className="size-4" />
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={signOut.isPending}
          className="m-2 justify-between px-4 py-2"
          onClick={(e) => {
            e.preventDefault();
            signOut.mutate(undefined);
          }}
        >
          <span>sign out</span>
          {signOut.isPending ? <Spinner /> : <LogOut className="size-4" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const Container = ({ className, ...props }: ComponentProps<"header">) => {
  return (
    <header
      className={cn(
        "sticky top-0 mx-auto flex h-header items-center gap-4 border-b bg-secondary/75 px-[max(calc((100vw-var(--max-width-app))/2+1rem),1rem)] backdrop-blur-md",
        className,
      )}
      {...props}
    />
  );
};

const Title = (props: ComponentProps<"h1">) => {
  return <h1 className="font-bold capitalize" {...props} />;
};

const Nav = (props: ComponentProps<"nav">) => {
  return <nav {...props} />;
};

const useSignOut = () => {
  const [isRedirectPending, startRedirectTransition] = useTransition();
  const navigate = useNavigate();

  const signOut = useMutation({
    mutationFn: signOutAction,
    onSuccess: () => {
      startRedirectTransition(async () => {
        await navigate({ to: "/sign-in" });
      });
    },
  });

  return {
    ...signOut,
    isPending: signOut.isPending || isRedirectPending,
  };
};
