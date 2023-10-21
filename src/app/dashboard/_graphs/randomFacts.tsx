"use client";

import type { ExerciseWithData } from "@/db/types";
import { useDisplayWeight } from "@/hooks/useDisplayWeight";
import { pluralize } from "@/lib/utils";

export const RandomFacts = ({
  exercises,
}: {
  exercises: ExerciseWithData[];
}) => {
  const displayWeight = useDisplayWeight();
  const data = prepareRandomFactsData(exercises);

  return (
    <Container>
      <Text>
        you have lifted{" "}
        <StrongText>{displayWeight.show(data.totalWeightLifted)}</StrongText> so
        far.
      </Text>
      <Text>
        with a total of <StrongText>{data.totalNumberOfRepetitions}</StrongText>{" "}
        {pluralize({
          noun: "repetition",
          count: data.totalNumberOfRepetitions,
        })}
        .
      </Text>
      <Text>
        you exercised <StrongText>{data.numberOfDays}</StrongText>{" "}
        {pluralize({ noun: "day", count: data.numberOfDays })} so far
      </Text>
      <Text>
        you have explored <StrongText>{data.totalExercises}</StrongText>{" "}
        different {pluralize({ noun: "exercise", count: data.totalExercises })}.
      </Text>
      <Text>
        you logged a total of <StrongText>{data.totalData}</StrongText> data
      </Text>
    </Container>
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

const Container = (props: ComponentProps<"div">) => {
  return (
    <div
      {...props}
      className="flex h-full flex-col justify-around p-2 text-left text-sm text-muted-foreground"
    />
  );
};

const Text = (props: ComponentProps<"p">) => {
  return <p {...props} className="first-letter:capitalize" />;
};

const StrongText = (props: ComponentProps<"span">) => {
  return <strong {...props} className="font-bold text-brand-color-two" />;
};
