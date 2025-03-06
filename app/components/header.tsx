import { Link } from "@tanstack/react-router";
import { Button } from "~/ui/button";
import { Spinner } from "~/ui/spinner";
import {
  LogOutIcon,
  SettingsIcon,
  UserIcon,
  LaptopIcon,
  SunIcon,
  MoonIcon,
  HomeIcon,
  GroupIcon,
  ArrowRightIcon,
} from "~/ui/icons";
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
import { useUser } from "~/user/hooks/use-user";
import { cn } from "~/styles/styles.utils";
import { weightUnitEnum } from "~/db/db.schemas";
import { useUpdateWeightUnit } from "~/user/hooks/use-update-weight-unit";
import { userSchema } from "~/user/user.schemas";
import { AppIcon } from "~/ui/app-icon";
import { useSignOut } from "~/auth/hooks/use-sign-out";
import { useTheme } from "~/theme/theme.context";
import { themeSchema } from "~/theme/theme.schemas";
import type { ComponentProps } from "react";

export const HeaderPublic = () => {
  return (
    <Container className="gap-0 border-none bg-transparent backdrop-blur-xs">
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
          <ArrowRightIcon />
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
    <Container className="fixed top-auto bottom-0 border-t border-b-0 lg:hidden">
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
  const user = useUser();

  return (
    <Nav className="flex h-full gap-10">
      <Link
        className="text-muted-foreground ring-offset-background after:bg-primary hover:text-foreground focus-visible:ring-ring data-[status=active]:text-foreground relative flex items-center font-bold capitalize transition-colors after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:translate-y-1/2 after:opacity-0 after:transition-opacity hover:after:opacity-100 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden data-[status=active]:after:opacity-100"
        to="/dashboard"
      >
        dashbaord
      </Link>
      <Link
        className="text-muted-foreground ring-offset-background after:bg-primary hover:text-foreground focus-visible:ring-ring data-[status=active]:text-foreground relative flex items-center font-bold capitalize transition-colors after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:translate-y-1/2 after:opacity-0 after:transition-opacity hover:after:opacity-100 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden data-[status=active]:after:opacity-100"
        to="/settings"
      >
        settings
      </Link>
      <Link
        className="text-muted-foreground ring-offset-background after:bg-primary hover:text-foreground focus-visible:ring-ring data-[status=active]:text-foreground before:bg-primary before:text-primary-foreground relative flex items-center font-bold capitalize transition-colors before:absolute before:top-0 before:right-0 before:flex before:size-5 before:translate-x-full before:translate-y-1/2 before:items-center before:justify-center before:rounded-full before:text-xs before:content-[attr(data-notification-count)] after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:opacity-0 after:transition-opacity hover:after:opacity-100 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden data-[notification-count=0]:before:hidden data-[status=active]:after:opacity-100"
        to="/teams"
        data-notification-count={user.data.teamNotifications.length}
        activeOptions={{ exact: true }}
      >
        teams
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
        className="data-[status=active]:[&>svg]:fill-foreground"
        aria-label="go to teams"
      >
        <Link to="/teams">
          <GroupIcon />
        </Link>
      </Button>
      <Button
        asChild
        variant="ghost"
        className="data-[status=active]:[&>svg]:fill-foreground"
        aria-label="go to dashboard"
      >
        <Link to="/dashboard">
          <HomeIcon />
        </Link>
      </Button>
      <Button
        asChild
        variant="ghost"
        className="data-[status=active]:[&>svg]:fill-foreground"
        aria-label="go to settings"
      >
        <Link to="/settings">
          <UserIcon />
        </Link>
      </Button>
    </Nav>
  );
};

const UserProfileDropdown = () => {
  const user = useUser();
  const signOut = useSignOut();
  const updateWeightUnit = useUpdateWeightUnit();
  const theme = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="ml-auto">
          <UserIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72" align="end">
        <hgroup className="m-2 p-2">
          <h1 className="truncate font-semibold">{user.data.name}</h1>
          <p className="font-muted-foreground truncate text-sm">
            {user.data.email}
          </p>
        </hgroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="m-2 justify-between px-4 py-2">
          <Link to="/settings">
            <span>settings</span>
            <SettingsIcon />
          </Link>
        </DropdownMenuItem>
        <DropdownMenuGroup className="m-2 flex items-center justify-between gap-2 px-4 py-2">
          <p className="text-sm">weight unit</p>
          <DropdownMenuRadioGroup
            className="flex gap-2"
            value={user.data.weightUnit}
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
                className="focus:bg-accent aria-checked:bg-accent flex cursor-pointer items-center justify-center rounded-md border p-1.5 outline-hidden transition-colors disabled:pointer-events-none disabled:opacity-50 **:data-[state=checked]:hidden"
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
            value={theme.value}
            onValueChange={(unsafeTheme) => {
              theme.set(themeSchema.parse(unsafeTheme));
            }}
          >
            <DropdownMenuRadioItem
              value={themeSchema.Values.system}
              className="focus:bg-accent aria-checked:bg-accent flex cursor-pointer items-center justify-center rounded-md border p-1.5 outline-hidden transition-colors disabled:pointer-events-none disabled:opacity-50 **:data-[state=checked]:hidden"
              onSelect={(e) => e.preventDefault()}
            >
              <LaptopIcon />
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem
              value={themeSchema.Values.light}
              className="focus:bg-accent aria-checked:bg-accent flex cursor-pointer items-center justify-center rounded-md border p-1.5 outline-hidden transition-colors disabled:pointer-events-none disabled:opacity-50 **:data-[state=checked]:hidden"
              onSelect={(e) => e.preventDefault()}
            >
              <SunIcon />
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem
              value={themeSchema.Values.dark}
              className="focus:bg-accent aria-checked:bg-accent flex cursor-pointer items-center justify-center rounded-md border p-1.5 outline-hidden transition-colors disabled:pointer-events-none disabled:opacity-50 **:data-[state=checked]:hidden"
              onSelect={(e) => e.preventDefault()}
            >
              <MoonIcon />
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={signOut.isPending}
          className="m-2 justify-between px-4 py-2"
          data-umami-event="sign-out"
          onClick={(e) => {
            e.preventDefault();
            signOut.mutate(undefined);
          }}
        >
          <span>sign out</span>
          {signOut.isPending ? <Spinner /> : <LogOutIcon />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const Container = ({ className, ...props }: ComponentProps<"header">) => {
  return (
    <header
      className={cn(
        "h-header bg-secondary/75 sticky top-0 right-0 left-0 z-20 mx-auto flex items-center gap-4 border-b px-[max(calc((100vw-var(--max-width-app))/2+1rem),1rem)] backdrop-blur-md",
        className,
      )}
      {...props}
    />
  );
};

const Nav = (props: ComponentProps<"nav">) => {
  return <nav {...props} />;
};
