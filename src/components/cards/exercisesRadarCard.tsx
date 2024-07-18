import { Card } from "../ui/card";
import { RadarGraph } from "../graphs/radarGraph";
import type { ComponentProps } from "react";

type Props = ComponentProps<typeof RadarGraph>;

export const ExercisesRadarCard = ({ data }: Props) => {
  return (
    <Card.Root>
      <Card.Header>
        <Card.Title>exercises count</Card.Title>
      </Card.Header>

      <RadarGraph data={data} />
    </Card.Root>
  );
};
