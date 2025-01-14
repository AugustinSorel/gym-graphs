import {
  CatchBoundary,
  createFileRoute,
  ErrorComponentProps,
  redirect,
} from "@tanstack/react-router";
import { useUser } from "~/user/user.context";
import { ComponentProps } from "react";
import { Separator } from "~/ui/separator";
import { Button } from "~/ui/button";
import { Badge } from "~/ui/badge";
import { cn } from "~/styles/styles.utils";
import { Github, Laptop, Moon, MoreHorizontal, Sun } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "~/ui/toggle-group";
import { Spinner } from "~/ui/spinner";
import { RenameUserDialog } from "~/user/components/rename-user-dialog";
import { DeleteAccountDialog } from "~/user/components/delete-account-dialog";
import { DefaultErrorFallback } from "~/components/default-error-fallback";
import { weightUnitEnum } from "~/db/db.schemas";
import { userSchema } from "~/user/user.schemas";
import { useUpdateWeightUnit } from "~/user/hooks/useUpdateWeightUnit";
import { useSignOut } from "~/auth/hooks/use-sign-out";
import { pluralize } from "~/utils/string.utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "~/ui/dropdown-menu";
import { CreateTagDialog } from "~/tag/components/create-tag-dialog";
import { DeleteTagDialog } from "~/tag/components/delete-tag-dialog";
import { useTheme } from "~/theme/theme.context";
import { themeSchema } from "~/theme/theme.schemas";

export const Route = createFileRoute("/settings")({
  component: () => RouteComponent(),
  errorComponent: (props) => RouteFallback(props),
  beforeLoad: async ({ context }) => {
    if (!context.user || !context.session) {
      throw redirect({ to: "/sign-in" });
    }
  },
});

const RouteFallback = (props: ErrorComponentProps) => {
  return (
    <Main>
      <DefaultErrorFallback {...props} />
    </Main>
  );
};

const RouteComponent = () => {
  return (
    <Main>
      <Header>
        <Title>account settings</Title>
      </Header>

      <Separator />

      <EmailSection />
      <RenameUserSection />
      <TagsSection />
      <ChangeWeightUnitSection />
      <ChangeThemeSection />
      <GithubLinkSection />
      <SignOutSection />
      <DeleteAccountSection />
    </Main>
  );
};

const EmailSection = () => {
  const user = useUser();

  return (
    <CatchBoundary
      errorComponent={DefaultErrorFallback}
      getResetKey={() => "reset"}
    >
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
    <CatchBoundary
      errorComponent={DefaultErrorFallback}
      getResetKey={() => "reset"}
    >
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

const TagsSection = () => {
  const user = useUser();

  return (
    <CatchBoundary
      errorComponent={DefaultErrorFallback}
      getResetKey={() => "reset"}
    >
      <Section>
        <HGroup>
          <SectionTitle>tags</SectionTitle>
          <SectionDescription>Manage your exercise tags</SectionDescription>

          <List>
            {!user.tags.length && (
              <p className="p-6 text-center text-muted-foreground">no tags</p>
            )}
            {user.tags.map((tag) => (
              <ListItem
                key={tag.id}
                className="[counter-increment:item] before:row-span-2 before:flex before:h-10 before:w-10 before:items-center before:justify-center before:rounded-full before:border before:border-border before:bg-accent before:text-lg before:font-semibold before:text-muted-foreground before:content-[counter(item)]"
              >
                <ListItemTitle>{tag.name}</ListItemTitle>

                <ListItemSubtitle>
                  {pluralize(1, "exercise")} linked
                </ListItemSubtitle>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="row-span-3 h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DeleteTagDialog tagId={tag.id} />
                  </DropdownMenuContent>
                </DropdownMenu>
              </ListItem>
            ))}
          </List>
        </HGroup>
        <Footer>
          <CreateTagDialog />
        </Footer>
      </Section>
    </CatchBoundary>
  );
};

const ChangeWeightUnitSection = () => {
  const updateWeightUnit = useUpdateWeightUnit();
  const user = useUser();

  return (
    <CatchBoundary
      errorComponent={DefaultErrorFallback}
      getResetKey={() => "reset"}
    >
      <Section>
        <HGroup>
          <SectionTitle>change weight unit</SectionTitle>
          <SectionDescription>
            Tailor your experience by selecting your preferred weight unit.
          </SectionDescription>
        </HGroup>
        <Footer>
          <ToggleGroup
            type="single"
            value={user.weightUnit}
            variant="outline"
            onValueChange={(unsafeWeightUnit: string | null) => {
              updateWeightUnit.mutate({
                data: {
                  weightUnit: userSchema.shape.weightUnit
                    .catch(user.weightUnit)
                    .parse(unsafeWeightUnit),
                },
              });
            }}
          >
            {weightUnitEnum.enumValues.map((weightUnit) => (
              <ToggleGroupItem
                key={weightUnit}
                value={weightUnit}
                aria-label={`Change weight unit to ${weightUnit}`}
                variant="outline"
              >
                {weightUnit}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Footer>
      </Section>
    </CatchBoundary>
  );
};

const ChangeThemeSection = () => {
  const theme = useTheme();

  return (
    <CatchBoundary
      errorComponent={DefaultErrorFallback}
      getResetKey={() => "reset"}
    >
      <Section>
        <HGroup>
          <SectionTitle>change theme</SectionTitle>
          <SectionDescription>
            Make your workspace truly yours with our flexible theme options.
          </SectionDescription>
        </HGroup>
        <Footer>
          <ToggleGroup
            type="single"
            value={theme.value}
            onValueChange={(newTheme: string | null) => {
              if (!newTheme) {
                return;
              }

              theme.set(themeSchema.parse(newTheme));
            }}
          >
            <ToggleGroupItem
              value={themeSchema.Values.system}
              aria-label="Change theme to system"
              variant="outline"
            >
              <Laptop className="size-4" />
            </ToggleGroupItem>
            <ToggleGroupItem
              value={themeSchema.Values.light}
              aria-label="Change theme to light"
              variant="outline"
            >
              <Sun className="size-4" />
            </ToggleGroupItem>
            <ToggleGroupItem
              value={themeSchema.Values.dark}
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
    <CatchBoundary
      errorComponent={DefaultErrorFallback}
      getResetKey={() => "reset"}
    >
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
    <CatchBoundary
      errorComponent={DefaultErrorFallback}
      getResetKey={() => "reset"}
    >
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
    <CatchBoundary
      errorComponent={DefaultErrorFallback}
      getResetKey={() => "reset"}
    >
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

const Main = (props: ComponentProps<"main">) => {
  return (
    <main
      className="mx-auto flex max-w-app flex-col gap-10 px-2 pb-20 pt-10 sm:px-4 lg:gap-20 lg:pt-20"
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

const SectionDescription = (props: ComponentProps<"p">) => {
  return <p className="text-sm" {...props} />;
};

const Header = (props: ComponentProps<"header">) => {
  return <header className="grid gap-2" {...props} />;
};

const Section = ({ className, ...props }: ComponentProps<"section">) => {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-md border bg-secondary",
        className,
      )}
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

const List = (props: ComponentProps<"ul">) => {
  return (
    <ul
      className="max-h-96 items-center overflow-auto rounded-md border [counter-reset:item]"
      {...props}
    />
  );
};

const ListItem = ({ className, ...props }: ComponentProps<"li">) => {
  return (
    <li
      className={cn(
        "relative grid grid-cols-[auto_1fr_auto] items-center gap-x-4 p-4 text-sm transition-colors hover:bg-accent",
        className,
      )}
      {...props}
    />
  );
};

const ListItemTitle = (props: ComponentProps<"h3">) => {
  return <h3 className="truncate font-semibold capitalize" {...props} />;
};

const ListItemSubtitle = (props: ComponentProps<"p">) => {
  return <p className="col-start-2 row-start-2 truncate text-xs" {...props} />;
};
