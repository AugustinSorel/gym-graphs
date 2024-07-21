"use client";

import { Carousel } from "@/components/ui/carousel";
import { useDisplayWeight } from "@/hooks/useDisplayWeight";
import type { ComponentPropsWithoutRef } from "react";
import type { prepareUserRandomFactsData } from "@/lib/math";

type Props = { data: ReturnType<typeof prepareUserRandomFactsData> };

export const UserRandomFacts = (props: Props) => {
  const displayWeight = useDisplayWeight();

  return (
    <Carousel.Root itemsSize={5}>
      <Carousel.ArrowNavigation />
      <Carousel.Body>
        <CardContainer>
          <Text>weight lifted</Text>
          <StrongText>
            {displayWeight.show(props.data.amountOfWeightLifted)}
          </StrongText>
        </CardContainer>
        <CardContainer>
          <Text>repetitions made</Text>
          <StrongText>{props.data.numberOfRepetitionsMade}</StrongText>
        </CardContainer>
        <CardContainer>
          <Text>number of days</Text>
          <StrongText>{props.data.numberOfDays}</StrongText>
        </CardContainer>
        <CardContainer>
          <Text>exercises explored</Text>
          <StrongText>{props.data.numberOfExercisesCreated}</StrongText>
        </CardContainer>
        <CardContainer>
          <Text>data logged</Text>
          <StrongText>{props.data.numberOfDataLogged}</StrongText>
        </CardContainer>
      </Carousel.Body>
      <Carousel.DotsNavigation />
    </Carousel.Root>
  );
};

const CardContainer = (props: ComponentPropsWithoutRef<"div">) => {
  return (
    <div
      {...props}
      className="grid grid-rows-[1fr_auto_1fr] gap-4 overflow-hidden text-muted-foreground"
    />
  );
};

const Text = (props: ComponentPropsWithoutRef<"p">) => {
  return <p {...props} className="self-end first-letter:capitalize" />;
};

const StrongText = (props: ComponentPropsWithoutRef<"span">) => {
  return (
    <strong {...props} className="text-4xl font-bold text-brand-color-two" />
  );
};
