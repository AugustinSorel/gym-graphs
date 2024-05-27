"use client";

import { Carousel } from "@/components/ui/carousel";
import type { ExerciseWithData } from "@/server/db/types";
import { useDisplayWeight } from "@/hooks/useDisplayWeight";
import type { ComponentPropsWithoutRef } from "react";

type Props = {
  exercises: ExerciseWithData[];
};

export const RandomFacts = ({ exercises }: Props) => {
  const displayWeight = useDisplayWeight();
  const data = prepareRandomFactsData(exercises);

  return (
    <Carousel.Root itemsSize={5}>
      <Carousel.ArrowNavigation />
      <Carousel.Body>
        <CardContainer>
          <Text>weight lifted</Text>
          <StrongText>{displayWeight.show(data.totalWeightLifted)}</StrongText>
        </CardContainer>
        <CardContainer>
          <Text>repetitions made</Text>
          <StrongText>{data.totalNumberOfRepetitions}</StrongText>
        </CardContainer>
        <CardContainer>
          <Text>number of days</Text>
          <StrongText>{data.numberOfDays}</StrongText>
        </CardContainer>
        <CardContainer>
          <Text>exercises explored</Text>
          <StrongText>{data.totalExercises}</StrongText>
        </CardContainer>
        <CardContainer>
          <Text>data logged</Text>
          <StrongText>{data.totalData}</StrongText>
        </CardContainer>
      </Carousel.Body>
      <Carousel.DotsNavigation />
    </Carousel.Root>
  );
};

const prepareRandomFactsData = (exercises: ExerciseWithData[]) => {
  return {
    totalWeightLifted: exercises.reduce((prev, curr) => {
      return (
        prev +
        curr.data.reduce((prev, curr) => {
          return prev + curr.weightLifted;
        }, 0)
      );
    }, 0),

    totalNumberOfRepetitions: exercises.reduce((prev, curr) => {
      return (
        prev +
        curr.data.reduce((prev, curr) => {
          return prev + curr.numberOfRepetitions;
        }, 0)
      );
    }, 0),

    numberOfDays: exercises.reduce((prev, curr) => {
      curr.data.forEach((x) => prev.add(x.doneAt));

      return prev;
    }, new Set<string>()).size,

    totalExercises: exercises.length,

    totalData: exercises.reduce((prev, curr) => {
      return prev + curr.data.length;
    }, 0),
  };
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
