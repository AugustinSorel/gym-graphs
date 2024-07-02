"use client";

import { ErrorBoundary } from "react-error-boundary";
import { Card } from "./card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useWeightUnit, weightUnitSchema } from "@/context/weightUnit";

export const WeightUnitPreferenceCard = () => {
  const weightUnit = useWeightUnit();

  return (
    <ErrorBoundary FallbackComponent={Card.ErrorFallback}>
      <Card.Root>
        <Card.Body>
          <Card.Title>weight unit</Card.Title>
          <Card.Description>
            Tailor your experience by selecting your preferred weight unit.
          </Card.Description>
        </Card.Body>
        <Card.Footer>
          <ToggleGroup
            type="single"
            value={weightUnit.get}
            variant="outline"
            onValueChange={(d) => {
              weightUnit.set(weightUnitSchema.parse(d));
            }}
          >
            <ToggleGroupItem value="lb" aria-label="Change weight unit to lbs">
              <span>lbs</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="kg" aria-label="Change weight unit to kg">
              <span>kg</span>
            </ToggleGroupItem>
          </ToggleGroup>
        </Card.Footer>
      </Card.Root>
    </ErrorBoundary>
  );
};
