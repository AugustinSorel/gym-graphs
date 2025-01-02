import {
  CatchBoundary,
  createFileRoute,
  ErrorComponentProps,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { UserProvider, useUser } from "~/features/context/user.context";
import { ComponentProps, useTransition } from "react";
import { Separator } from "~/features/ui/separator";
import { Button } from "~/features/ui/button";
import { Badge } from "~/features/ui/badge";
import { cn } from "~/features/utils/styles";
import { Github, Laptop, Moon, Sun } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "~/features/ui/toggle-group";
import { useMutation } from "@tanstack/react-query";
import { signOutAction } from "~/features/auth/auth.actions";
import { Spinner } from "~/features/ui/spinner";
import { RenameUserDialog } from "~/features/user/components/rename-user-dialog";
import { DeleteAccountDialog } from "~/features/user/components/delete-account-dialog";

export const Route = createFileRoute("/settings")({
  component: () => RouteComponent(),
  beforeLoad: async ({ context }) => {
    if (!context.user || !context.session) {
      throw redirect({ to: "/sign-in" });
    }

    return {
      user: context.user,
    };
  },
  loader: ({ context }) => {
    return {
      user: context.user,
    };
  },
});

const RouteComponent = () => {
  const loaderData = Route.useLoaderData();

  return (
    <UserProvider user={loaderData.user}>
      <Main>
        <Header>
          <Title>account settings</Title>
        </Header>

        <Separator />

        <EmailSection />
        <RenameUserSection />
        <ChangeWeightUnitSection />
        <ChangeThemeSection />
        <GithubLinkSection />
        <SignOutSection />
        <DeleteAccountSection />
      </Main>
    </UserProvider>
  );
};

const EmailSection = () => {
  const user = useUser();

  return (
    <CatchBoundary errorComponent={SectionFallback} getResetKey={() => "reset"}>
      <Section>
        <HGroup>
          <SectionTitle>email address</SectionTitle>
          <SectionDescription>
            {user.email}{" "}
            <Badge className="ml-1" variant="success">
              verified
            </Badge>
          </SectionDescription>
        </HGroup>
      </Section>
    </CatchBoundary>
  );
};

const RenameUserSection = () => {
  return (
    <CatchBoundary errorComponent={SectionFallback} getResetKey={() => "reset"}>
      <Section>
        <HGroup>
          <SectionTitle>rename yourself</SectionTitle>
          <SectionDescription>
            Feel free to rename yourself to a more confortable name. Your name
            is not public but it will be visible to the members of your teams.
          </SectionDescription>
        </HGroup>
        <Footer>
          <RenameUserDialog />
        </Footer>
      </Section>
    </CatchBoundary>
  );
};

const ChangeWeightUnitSection = () => {
  return (
    <CatchBoundary errorComponent={SectionFallback} getResetKey={() => "reset"}>
      <Section>
        <HGroup>
          <SectionTitle>change weight unit</SectionTitle>
          <SectionDescription>
            Tailor your experience by selecting your preferred weight unit.
          </SectionDescription>
        </HGroup>
        <Footer>
          <ToggleGroup type="single">
            <ToggleGroupItem
              value="kilo"
              aria-label="Change weight unit to kg"
              variant="outline"
            >
              kg
            </ToggleGroupItem>
            <ToggleGroupItem
              value="pounds"
              aria-label="Change weight unit to lbs"
              variant="outline"
            >
              lbs
            </ToggleGroupItem>
          </ToggleGroup>
        </Footer>
      </Section>
    </CatchBoundary>
  );
};

const ChangeThemeSection = () => {
  return (
    <CatchBoundary errorComponent={SectionFallback} getResetKey={() => "reset"}>
      <Section>
        <HGroup>
          <SectionTitle>change theme</SectionTitle>
          <SectionDescription>
            Make your workspace truly yours with our flexible theme options.
          </SectionDescription>
        </HGroup>
        <Footer>
          <ToggleGroup type="single">
            <ToggleGroupItem
              value="system"
              aria-label="Change theme to system"
              variant="outline"
            >
              <Laptop className="size-4" />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="light"
              aria-label="Change theme to light"
              variant="outline"
            >
              <Sun className="size-4" />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="dark"
              aria-label="Change theme to dark"
              variant="outline"
            >
              <Moon className="size-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </Footer>
      </Section>
    </CatchBoundary>
  );
};

const GithubLinkSection = () => {
  return (
    <CatchBoundary errorComponent={SectionFallback} getResetKey={() => "reset"}>
      <Section>
        <HGroup>
          <SectionTitle>github</SectionTitle>
          <SectionDescription>
            If you're interested in the behind-the-scenes development of our
            platform, we invite you to explore the code on our Github! We highly
            value feedback and contributions from our community.
          </SectionDescription>
        </HGroup>
        <Footer>
          <Button size="sm" asChild>
            <a
              href="https://github.com/augustinsorel/gym-graphs"
              target="_blank"
            >
              <Github className="size-4" />
              <span>view</span>
            </a>
          </Button>
        </Footer>
      </Section>
    </CatchBoundary>
  );
};

const SignOutSection = () => {
  const signOut = useSignOut();

  return (
    <CatchBoundary errorComponent={SectionFallback} getResetKey={() => "reset"}>
      <Section>
        <HGroup>
          <SectionTitle>sign out</SectionTitle>
          <SectionDescription>Sign out from this device.</SectionDescription>
        </HGroup>
        <Footer>
          <Button
            size="sm"
            disabled={signOut.isPending}
            onClick={() => {
              signOut.mutate(undefined);
            }}
          >
            <span>sign out</span>
            {signOut.isPending && <Spinner />}
          </Button>
        </Footer>
      </Section>
    </CatchBoundary>
  );
};

const DeleteAccountSection = () => {
  return (
    <CatchBoundary errorComponent={SectionFallback} getResetKey={() => "reset"}>
      <Section className="border-destructive">
        <HGroup>
          <SectionTitle>delete account</SectionTitle>
          <SectionDescription>
            Permanently remove your personal account and all of its contents
            from our servers. This action is not reversible, so please continue
            with caution.
          </SectionDescription>
        </HGroup>
        <Footer className="border-destructive bg-destructive/10">
          <DeleteAccountDialog />
        </Footer>
      </Section>
    </CatchBoundary>
  );
};

const SectionFallback = (props: ErrorComponentProps) => {
  return (
    <CatchBoundary errorComponent={SectionFallback} getResetKey={() => "reset"}>
      <Section className="border-destructive bg-destructive/10">
        <HGroup>
          <SectionTitle>something went wrong</SectionTitle>
          <SectionErrorMsg>{props.error.message}</SectionErrorMsg>
        </HGroup>
        <Footer className="border-destructive">
          <Button size="sm" onClick={props.reset} variant="destructive">
            try again
          </Button>
        </Footer>
      </Section>
    </CatchBoundary>
  );
};

const Main = (props: ComponentProps<"main">) => {
  return (
    <main
      className="mx-auto flex max-w-app flex-col gap-10 px-4 py-20"
      {...props}
    />
  );
};

const Title = (props: ComponentProps<"h1">) => {
  return <h1 className="text-3xl font-semibold capitalize" {...props} />;
};

const SectionTitle = (props: ComponentProps<"h2">) => {
  return <h2 className="text-xl font-semibold capitalize" {...props} />;
};

const SectionErrorMsg = (props: ComponentProps<"code">) => {
  return <code className="flex text-sm" {...props} />;
};

const SectionDescription = (props: ComponentProps<"p">) => {
  return <p className="text-sm" {...props} />;
};

const Header = (props: ComponentProps<"header">) => {
  return <header className="grid gap-2" {...props} />;
};

const Section = ({ className, ...props }: ComponentProps<"section">) => {
  return (
    <section
      className={cn("rounded-md border bg-secondary", className)}
      {...props}
    />
  );
};

const HGroup = (props: ComponentProps<"hgroup">) => {
  return <hgroup className="space-y-3 p-6" {...props} />;
};

const Footer = ({ className, ...props }: ComponentProps<"footer">) => {
  return (
    <footer
      className={cn(
        "flex items-center justify-end border-t bg-background px-6 py-4",
        className,
      )}
      {...props}
    />
  );
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
