"use client";

import type { ComponentPropsWithoutRef } from "react";
import { ExerciseGraph } from "./exerciseGraph";
import { useExerciseDetails } from "../exerciseDetailsContext";

export const ExerciseGraphCard = () => {
  const { exercise } = useExerciseDetails();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{exercise.name}</CardTitle>
      </CardHeader>

      <CardBody>
        <ExerciseGraph />
      </CardBody>
    </Card>
  );
};

const Card = (props: ComponentPropsWithoutRef<"div">) => {
  return (
    <div
      {...props}
      className="border-y border-border bg-primary backdrop-blur-md sm:rounded-md sm:border"
    />
  );
};

const CardHeader = (props: ComponentPropsWithoutRef<"header">) => {
  return (
    <header {...props} className="border-b border-border bg-primary p-3" />
  );
};

const CardTitle = (props: ComponentPropsWithoutRef<"h2">) => {
  return <h2 {...props} className="truncate font-medium capitalize" />;
};

const CardBody = (props: ComponentPropsWithoutRef<"div">) => {
  return <div {...props} className="relative h-[500px] overflow-hidden" />;
};
