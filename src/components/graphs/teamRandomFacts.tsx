"use client";

import { Carousel } from "@/components/ui/carousel";
import { useDisplayWeight } from "@/hooks/useDisplayWeight";
import type { ComponentPropsWithoutRef } from "react";
import type { User } from "next-auth";

export type TeamRandomFactsProps = {
  facts: {
    userWhoLiftedTheMostWeight: Entry;
    userWhoDidTheMostOfReps: Entry;
    userWithTheMostActivity: Entry;
    userWhoCreatedTheMostExercises: Entry;
    userWithTheMostdataLogged: Entry;
  };
};

type Entry = { value: number } & Pick<User, "name">;

export const TeamRandomFacts = (props: TeamRandomFactsProps) => {
  const displayWeight = useDisplayWeight();

  return (
    <Carousel.Root itemsSize={5}>
      <Carousel.ArrowNavigation />
      <Carousel.Body>
        <CardContainer>
          <Text>
            <UserName>{props.facts.userWhoLiftedTheMostWeight.name}</UserName>
            <br />
            lifted the most weight
          </Text>
          <StrongText>
            {displayWeight.show(props.facts.userWhoLiftedTheMostWeight.value)}
          </StrongText>
        </CardContainer>
        <CardContainer>
          <Text>
            <UserName>{props.facts.userWhoDidTheMostOfReps.name}</UserName>
            <br />
            did the most reps
          </Text>
          <StrongText>{props.facts.userWhoDidTheMostOfReps.value}</StrongText>
        </CardContainer>
        <CardContainer>
          <Text>
            <UserName>{props.facts.userWithTheMostActivity.name}</UserName>
            <br />
            has the most days
          </Text>
          <StrongText>{props.facts.userWithTheMostActivity.value}</StrongText>
        </CardContainer>
        <CardContainer>
          <Text>
            <UserName>
              {props.facts.userWhoCreatedTheMostExercises.name}
            </UserName>
            <br />
            created the most exercises
          </Text>
          <StrongText>
            {props.facts.userWhoCreatedTheMostExercises.value}
          </StrongText>
        </CardContainer>
        <CardContainer>
          <Text>
            <UserName>{props.facts.userWhoLiftedTheMostWeight.name}</UserName>
            <br />
            logged the most data
          </Text>
          <StrongText>{props.facts.userWithTheMostdataLogged.value}</StrongText>
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
      className="grid grid-rows-[1fr_auto_1fr] gap-4 overflow-hidden p-2 text-muted-foreground"
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

const UserName = (props: ComponentPropsWithoutRef<"span">) => {
  return <strong {...props} className="font-bold text-brand-color-two" />;
};
