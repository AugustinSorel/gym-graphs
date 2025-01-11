import { ComponentProps } from "react";
import { Link } from "@tanstack/react-router";
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
  Home,
  UsersRound,
  ArrowRight,
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
import { useUser } from "~/user/user.context";
import { cn } from "~/styles/styles.utils";
import { weightUnitEnum } from "~/db/db.schemas";
import { useUpdateWeightUnit } from "~/user/hooks/useUpdateWeightUnit";
import { userSchema } from "~/user/user.schemas";
import { AppIcon } from "~/ui/app-icon";
import { useSignOut } from "~/auth/hooks/use-sign-out";

export const HeaderPublic = () => {
  return (
    <Container className="gap-0 border-none bg-transparent backdrop-blur-sm">
      <AppIcon />
      <Button
        variant="link"
        asChild
        className="text-base font-semibold capitalize"
      >
        <Link to="/">gym graphs</Link>
      </Button>
      <Button
        variant="link"
        className="ml-auto flex items-center font-semibold capitalize"
        asChild
      >
        <Link to="/sign-up">
          <span>sign up</span>
          <ArrowRight />
        </Link>
      </Button>
    </Container>
  );
};

export const HeaderPrivate = () => {
  return (
    <>
      <MobileHeader />
      <DesktopHeader />
    </>
  );
};

const MobileHeader = () => {
  return (
    <Container className="fixed bottom-0 top-auto border-b-0 border-t lg:hidden">
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
  return (
    <Nav className="flex w-full items-center justify-evenly gap-4 [&_a_svg]:size-6">
      <Button
        asChild
        variant="ghost"
        className="data-[status=active]:bg-accent"
      >
        <Link to="/settings">
          <UsersRound />
        </Link>
      </Button>
      <Button
        asChild
        variant="ghost"
        className="data-[status=active]:bg-accent"
      >
        <Link to="/dashboard">
          <Home />
        </Link>
      </Button>
      <Button
        asChild
        variant="ghost"
        className="data-[status=active]:bg-accent"
      >
        <Link to="/settings">
          <User2 />
        </Link>
      </Button>
    </Nav>
  );
};

const UserProfileDropdown = () => {
  const user = useUser();
  const signOut = useSignOut();
  const updateWeightUnit = useUpdateWeightUnit();

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
        <DropdownMenuGroup className="m-2 flex items-center justify-between gap-2 px-4 py-2">
          <p className="text-sm">weight unit</p>
          <DropdownMenuRadioGroup
            className="flex gap-2"
            value={user.weightUnit}
            onValueChange={(unsafeWeightUnit) => {
              const weightUnit =
                userSchema.shape.weightUnit.parse(unsafeWeightUnit);

              updateWeightUnit.mutate({ data: { weightUnit } });
            }}
          >
            {weightUnitEnum.enumValues.map((weightUnit) => (
              <DropdownMenuRadioItem
                key={weightUnit}
                value={weightUnit}
                className="flex cursor-pointer items-center justify-center rounded-md border p-1.5 outline-none transition-colors focus:bg-accent disabled:pointer-events-none disabled:opacity-50 aria-checked:bg-accent [&_[data-state=checked]]:hidden"
                onSelect={(e) => e.preventDefault()}
              >
                <span className="text-xs">{weightUnit}</span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        <DropdownMenuGroup className="m-2 flex items-center justify-between gap-2 px-4 py-2">
          <p className="text-sm">theme</p>
          <DropdownMenuRadioGroup
            className="flex gap-2"
            // value={theme.theme}
            // onValueChange={theme.setTheme}
          >
            <DropdownMenuRadioItem
              value="system"
              className="flex cursor-pointer items-center justify-center rounded-md border p-1.5 outline-none transition-colors focus:bg-accent disabled:pointer-events-none disabled:opacity-50 aria-checked:bg-accent [&_[data-state=checked]]:hidden"
              onSelect={(e) => e.preventDefault()}
            >
              <Laptop className="size-4" />
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem
              value="light"
              className="flex cursor-pointer items-center justify-center rounded-md border p-1.5 outline-none transition-colors focus:bg-accent disabled:pointer-events-none disabled:opacity-50 aria-checked:bg-accent [&_[data-state=checked]]:hidden"
              onSelect={(e) => e.preventDefault()}
            >
              <Sun className="size-4" />
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem
              value="dark"
              className="flex cursor-pointer items-center justify-center rounded-md border p-1.5 outline-none transition-colors focus:bg-accent disabled:pointer-events-none disabled:opacity-50 aria-checked:bg-accent [&_[data-state=checked]]:hidden"
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
        "sticky left-0 right-0 top-0 z-20 mx-auto flex h-header items-center gap-4 border-b bg-secondary/75 px-[max(calc((100vw-var(--max-width-app))/2+1rem),1rem)] backdrop-blur-md",
        className,
      )}
      {...props}
    />
  );
};

const Nav = (props: ComponentProps<"nav">) => {
  return <nav {...props} />;
};
