import { GaugeOfWeightLiftedInTeam } from "~/team/components/gauge-of-weight-lifted-in-team";
import { WeightValue } from "~/weight-unit/components/weight-value";
import { WeightUnit } from "~/weight-unit/components/weight-unit";
import { cn } from "~/styles/styles.utils";
import { useTeam } from "~/team/hooks/use-team";
import { CatchBoundary, getRouteApi } from "@tanstack/react-router";
import { useUser } from "~/user/hooks/use-user";
import type { ComponentProps } from "react";
import type { ErrorComponentProps } from "@tanstack/react-router";

export const TeamFunFactsGrid = () => {
  return (
    <Grid>
      <CatchBoundary
        errorComponent={FunFactFallback}
        getResetKey={() => "reset"}
      >
        <UserContributionInTeamFunFact />
      </CatchBoundary>

      <CatchBoundary
        errorComponent={FunFactFallback}
        getResetKey={() => "reset"}
      >
        <BestLifterFunFact />
      </CatchBoundary>

      <CatchBoundary
        errorComponent={FunFactFallback}
        getResetKey={() => "reset"}
      >
        <TotalWeightLiftedInTeamFunFact />
      </CatchBoundary>
    </Grid>
  );
};

const routeApi = getRouteApi("/(teams)/teams_/$teamId");

const UserContributionInTeamFunFact = () => {
  const weightLiftedInTeam = useWeightLiftedInTeam();

  return (
    <FunFact className="row-span-2 grid-rows-[auto_200px]">
      <FunFactName>your contribution:</FunFactName>
      <GaugeOfWeightLiftedInTeam data={weightLiftedInTeam} />
    </FunFact>
  );
};

const BestLifterFunFact = () => {
  const params = routeApi.useParams();
  const team = useTeam(params.teamId);

  const membersSortedByTotalWeightInKgDesc = team.data.members.sort((a, b) => {
    return b.totalWeightInKg - a.totalWeightInKg;
  });

  const bestMember = membersSortedByTotalWeightInKgDesc.at(0);

  if (!bestMember) {
    throw new Error("no members in team");
  }

  return (
    <FunFact className="grid-cols-1">
      <FunFactName>the lift lord:</FunFactName>
      <Strong>{bestMember.user.name}</Strong>
    </FunFact>
  );
};

const TotalWeightLiftedInTeamFunFact = () => {
  const params = routeApi.useParams();
  const team = useTeam(params.teamId);

  const totalWeightInKgInTeam = team.data.members.reduce((acc, curr) => {
    return acc + curr.totalWeightInKg;
  }, 0);

  return (
    <FunFact className="grid-cols-1">
      <FunFactName>total weight lifted:</FunFactName>
      <Strong>
        <WeightValue weightInKg={totalWeightInKgInTeam} />
        <WeightUnit />
      </Strong>
    </FunFact>
  );
};

const Grid = (props: ComponentProps<"ol">) => {
  return (
    <ol
      className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:grid-rows-2"
      {...props}
    />
  );
};

const FunFact = ({ className, ...props }: ComponentProps<"li">) => {
  return (
    <li
      className={cn(
        "bg-secondary grid items-center gap-3 rounded-lg border p-3 text-center lg:p-6",
        className,
      )}
      {...props}
    />
  );
};

const FunFactName = (props: ComponentProps<"h2">) => {
  return (
    <h2
      {...props}
      className="text-sm font-semibold whitespace-nowrap capitalize"
    />
  );
};

const Strong = (props: ComponentProps<"strong">) => {
  return (
    <strong
      className="bg-brand-gradient truncate bg-clip-text py-1 text-4xl font-bold text-transparent"
      {...props}
    />
  );
};

const FunFactFallback = (props: ErrorComponentProps) => {
  return (
    <FunFact className="border-destructive bg-destructive/10">
      <ErrorMsg>{props.error.message}</ErrorMsg>
    </FunFact>
  );
};

const ErrorMsg = (props: ComponentProps<"code">) => {
  return <code className="max-h-32 overflow-auto p-4" {...props} />;
};

const useWeightLiftedInTeam = () => {
  const user = useUser();
  const params = routeApi.useParams();
  const team = useTeam(params.teamId);

  const userMember = team.data.members.find((member) => {
    return member.userId === user.data.id;
  });

  if (!userMember) {
    throw new Error("user not part of team");
  }

  const userTotalWeightInKg = userMember.totalWeightInKg;
  const totalWeightInKg = team.data.members.reduce((acc, curr) => {
    return acc + curr.totalWeightInKg;
  }, 0);

  return {
    userTotalWeightInKg,
    totalWeightInKg,
  };
};
