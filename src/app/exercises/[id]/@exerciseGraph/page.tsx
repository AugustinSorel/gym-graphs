"use client";

import { ExerciseGraph } from "./exerciseGraph";
import { useExercise } from "../exerciseContext";
import type { ComponentProps } from "react";

const Page = () => {
  const exercise = useExercise();

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

export default Page;

const Card = (props: ComponentProps<"div">) => {
  return (
    <div
      {...props}
      className="border-y border-border bg-primary backdrop-blur-md sm:rounded-md sm:border"
    />
  );
};

const CardHeader = (props: ComponentProps<"header">) => {
  return (
    <header {...props} className="border-b border-border bg-primary p-3" />
  );
};

const CardTitle = (props: ComponentProps<"h2">) => {
  return <h2 {...props} className="truncate font-medium capitalize" />;
};

const CardBody = (props: ComponentProps<"div">) => {
  return <div {...props} className="relative h-[500px] overflow-hidden" />;
};
