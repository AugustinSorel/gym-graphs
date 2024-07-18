import type { RouterOutputs } from "@/trpc/react";
import { Card } from "../ui/card";
import { TeamRandomFacts } from "../graphs/teamRandomFacts";
import { prepareTeamRandomFactsData } from "@/lib/math";

export const TeamRandomFactsCard = (
  props: Pick<RouterOutputs["team"]["get"], "usersToTeams">,
) => {
  return (
    <Card.Root>
      <Card.Header>
        <Card.Title>random facts</Card.Title>
      </Card.Header>

      <TeamRandomFacts facts={prepareTeamRandomFactsData(props.usersToTeams)} />
    </Card.Root>
  );
};
