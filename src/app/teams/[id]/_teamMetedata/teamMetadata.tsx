import { Card } from "@/components/ui/card";
import { GridLayout } from "@/components/ui/gridLayout";
import { Badge } from "@/components/ui/badge";
import { Timeline } from "@/components/ui/timeline";

export const TeamMetadata = () => {
  return (
    <Timeline>
      <Badge variant="accent" className="w-max">
        metadata
      </Badge>
      <GridLayout>
        <Card.Root>
          <Card.Header>
            <Card.Title>exercises count</Card.Title>
          </Card.Header>
        </Card.Root>
      </GridLayout>
    </Timeline>
  );
};
