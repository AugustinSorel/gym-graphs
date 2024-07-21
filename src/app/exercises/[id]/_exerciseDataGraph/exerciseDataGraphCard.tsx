"use client";

import { Card } from "../_components/card";
import { useExercisePageContext } from "../_components/exercisePageContext";
import { ExerciseDataGraph } from "./exerciseDataGraph";

export const ExerciseDataGraphCard = () => {
  const pageCtx = useExercisePageContext();

  return (
    <Card.Root>
      <Card.Header>
        <Card.Title>{pageCtx.exercise.name}</Card.Title>
      </Card.Header>

      <Card.Body>
        <ExerciseDataGraph />
      </Card.Body>
    </Card.Root>
  );
};
