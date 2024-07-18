import type { ComponentProps } from "react";
import { UserRandomFacts } from "../graphs/exercisesRandomFacts";
import { Card } from "../ui/card";

type Props = ComponentProps<typeof UserRandomFacts>;

export const UserRandomFactsCard = ({ data }: Props) => {
  return (
    <Card.Root>
      <Card.Header>
        <Card.Title>random facts</Card.Title>
      </Card.Header>

      <UserRandomFacts data={data} />
    </Card.Root>
  );
};
