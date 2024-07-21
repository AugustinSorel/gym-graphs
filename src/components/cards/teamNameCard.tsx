import type { RouterOutputs } from "@/trpc/react";
import { Card } from "../ui/card";
import { cn } from "@/lib/utils";
import type { ComponentPropsWithoutRef } from "react";

export const TeamNameCard = (
  props: Pick<RouterOutputs["team"]["get"], "name">,
) => {
  return (
    <Card.Root>
      <Card.Header>
        <Card.Title>team name</Card.Title>
      </Card.Header>
      <StrongText className="m-auto overflow-hidden capitalize">
        {props.name}
      </StrongText>
    </Card.Root>
  );
};

const StrongText = (props: ComponentPropsWithoutRef<"strong">) => {
  return (
    <strong
      {...props}
      className={cn("text-4xl font-bold text-brand-color-two", props.className)}
    />
  );
};
