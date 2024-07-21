import { HeatmapGraph } from "../graphs/heatmapGraph";
import { Card } from "../ui/card";
import type { ComponentProps } from "react";

type Props = ComponentProps<typeof HeatmapGraph>;

export const ExerciseHeatmapCard = ({ data }: Props) => {
  return (
    <Card.Root>
      <Card.Header>
        <Card.Title>heatmap</Card.Title>
      </Card.Header>

      <HeatmapGraph data={data} />
    </Card.Root>
  );
};
