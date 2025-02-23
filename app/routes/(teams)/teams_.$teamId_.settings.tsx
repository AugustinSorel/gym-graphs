import { CatchBoundary, createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { permissions } from "~/libs/permissions";
import { teamQueries } from "~/team/team.queries";
import { teamSchema } from "~/team/team.schemas";
import { cn } from "~/styles/styles.utils";
import { DefaultErrorFallback } from "~/components/default-error-fallback";
import { Button } from "~/ui/button";
import { ArrowLeft } from "lucide-react";
import { Separator } from "~/ui/separator";
import { useTeam } from "~/team/hooks/use-team";
import { RenameTeamDialog } from "~/team/components/rename-team-dialog";
import { TeamAdminGuard } from "~/team/components/team-admin-guard";
import { DeleteTeamDialog } from "~/team/components/delete-team-dialog";
import { LeaveTeamDialog } from "~/team/components/leave-team-dialog";
import { MembersList } from "~/team/components/members-list";
import { Badge } from "~/ui/badge";
import { ChangeTeamVisibilitySwitch } from "~/team/components/change-team-visibility-switch";
import type { ComponentProps } from "react";

export const Route = createFileRoute("/(teams)/teams_/$teamId_/settings")({
  params: z.object({
    teamId: z.coerce.number().pipe(teamSchema.shape.id),
  }),
  component: () => RouteComponent(),
  beforeLoad: async ({ context }) => {
    const user = permissions.teamSettings.view(context.user);

    return {
      user,
    };
  },
  loader: async ({ context, params }) => {
    const queries = {
      team: teamQueries.get(params.teamId),
    } as const;

    await context.queryClient.ensureQueryData(queries.team);
  },
});

const RouteComponent = () => {
  const params = Route.useParams();
  const team = useTeam(params.teamId);

  return (
    <Main>
      <Header>
        <Title>{team.data.name} settings</Title>
        <Button
          asChild
          variant="link"
          className="text-muted-foreground w-max p-0"
        >
          <Link to="..">
            <ArrowLeft />
            <span>back</span>
          </Link>
        </Button>
      </Header>

      <Separator />

      <RenameTileSection />
      <MembersListSection />
      <ChangeTeamVisibilitySection />
      <LeaveTeamSection />
      <DeleteTeamSection />
    </Main>
  );
};

const RenameTileSection = () => {
  return (
    <CatchBoundary
      errorComponent={DefaultErrorFallback}
      getResetKey={() => "reset"}
    >
      <TeamAdminGuard>
        <Section>
          <HGroup>
            <SectionTitle>rename exercise</SectionTitle>
            <SectionDescription>
              Feel free to rename this exercise to somehting more comfortable.
              Your exercises name are not public.
            </SectionDescription>
          </HGroup>
          <Footer>
            <RenameTeamDialog />
          </Footer>
        </Section>
      </TeamAdminGuard>
    </CatchBoundary>
  );
};

const MembersListSection = () => {
  return (
    <CatchBoundary
      errorComponent={DefaultErrorFallback}
      getResetKey={() => "reset"}
    >
      <Section>
        <HGroup>
          <SectionTitle>members</SectionTitle>
          <SectionDescription>
            Listing of all members that are part of this team.
          </SectionDescription>
        </HGroup>
        <MembersList />
        <Footer></Footer>
      </Section>
    </CatchBoundary>
  );
};

const ChangeTeamVisibilitySection = () => {
  return (
    <CatchBoundary
      errorComponent={DefaultErrorFallback}
      getResetKey={() => "reset"}
    >
      <Section className="grid grid-cols-[1fr_auto] items-center [&>button[role='switch']]:mr-3 lg:[&>button[role='switch']]:mr-6">
        <HGroup>
          <SectionTitle>team visibility</SectionTitle>
          <SectionDescription>
            Change the visibility of your team. Public means that your team will
            be visible by anyone <TeamVisibilityBadge />
          </SectionDescription>
        </HGroup>
        <ChangeTeamVisibilitySwitch />
      </Section>
    </CatchBoundary>
  );
};

const TeamVisibilityBadge = () => {
  const params = Route.useParams();
  const team = useTeam(params.teamId);

  switch (team.data.visibility) {
    case "public":
      return <Badge>public</Badge>;
    case "private":
      return <Badge variant="outline">private</Badge>;
  }

  team.data.visibility satisfies never;
};

const LeaveTeamSection = () => {
  return (
    <CatchBoundary
      errorComponent={DefaultErrorFallback}
      getResetKey={() => "reset"}
    >
      <Section className="border-destructive">
        <HGroup>
          <SectionTitle>leave team</SectionTitle>
          <SectionDescription>
            Permanently remove yourself from this team. All of your data stored
            in this team will be removed forever. This action is not reversible,
            so please continue with caution.
          </SectionDescription>
        </HGroup>
        <Footer className="border-destructive bg-destructive/10">
          <LeaveTeamDialog />
        </Footer>
      </Section>
    </CatchBoundary>
  );
};

const DeleteTeamSection = () => {
  return (
    <CatchBoundary
      errorComponent={DefaultErrorFallback}
      getResetKey={() => "reset"}
    >
      <TeamAdminGuard>
        <Section className="border-destructive">
          <HGroup>
            <SectionTitle>delete team</SectionTitle>
            <SectionDescription>
              Permanently remove this team and all of its contents from our
              servers. This action is not reversible, so please continue with
              caution.
            </SectionDescription>
          </HGroup>
          <Footer className="border-destructive bg-destructive/10">
            <DeleteTeamDialog />
          </Footer>
        </Section>
      </TeamAdminGuard>
    </CatchBoundary>
  );
};

const Main = (props: ComponentProps<"main">) => {
  return (
    <main
      className="max-w-app mx-auto flex flex-col gap-10 px-2 pt-10 pb-20 sm:px-4 lg:gap-20 lg:pt-20"
      {...props}
    />
  );
};

const Section = ({ className, ...props }: ComponentProps<"section">) => {
  return (
    <section
      className={cn(
        "bg-secondary relative grid overflow-hidden rounded-md border",
        className,
      )}
      {...props}
    />
  );
};

const Header = (props: ComponentProps<"header">) => {
  return <header className="grid gap-2" {...props} />;
};

const Title = (props: ComponentProps<"h1">) => {
  return (
    <h1 className="truncate text-3xl font-semibold capitalize" {...props} />
  );
};

const HGroup = (props: ComponentProps<"hgroup">) => {
  return <hgroup className="space-y-3 p-3 lg:p-6" {...props} />;
};

const Footer = ({ className, ...props }: ComponentProps<"footer">) => {
  return (
    <footer
      className={cn(
        "bg-background flex items-center justify-end border-t px-3 py-4 lg:px-6",
        className,
      )}
      {...props}
    />
  );
};

const SectionTitle = (props: ComponentProps<"h2">) => {
  return <h2 className="text-xl font-semibold capitalize" {...props} />;
};

const SectionDescription = (props: ComponentProps<"p">) => {
  return <p className="text-sm" {...props} />;
};
