"use client";

import { Card } from "../_components/card";
import { ExerciseDataTable } from "./exerciseDataTable";
import {
  exerciseDataTableColumns,
  exerciseTableColumnsWithoutActions,
} from "./exerciseDataTableColumns";

export const ExerciseDataTableCard = () => {
  return (
    <Card.Root>
      <ExerciseDataTable columns={exerciseDataTableColumns} />
    </Card.Root>
  );
};

export const ExerciseDataTableCardDummy = () => {
  return (
    <Card.Root>
      <ExerciseDataTable columns={exerciseTableColumnsWithoutActions} />
    </Card.Root>
  );
};
