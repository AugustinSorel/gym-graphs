import type { ComponentProps } from "react";
import { cn } from "~/styles/styles.utils";
import type { Set } from "@gym-graphs/shared/set/schemas";
import { CatchBoundary } from "@tanstack/react-router";
import type { ErrorComponentProps } from "@tanstack/react-router";

type Props = {
  sets: ReadonlyArray<Set>;
};

export const ExerciseStatGrid = (_props: Props) => {
  return (
    <Grid>
      <CatchBoundary
        errorComponent={StatCardFallback}
        getResetKey={() => "reset"}
      >
        <Card>
          <Label>best 1rm</Label>
          <Value>—</Value>
        </Card>
      </CatchBoundary>

      <CatchBoundary
        errorComponent={StatCardFallback}
        getResetKey={() => "reset"}
      >
        <Card>
          <Label>highest weight</Label>
          <Value>—</Value>
        </Card>
      </CatchBoundary>

      <CatchBoundary
        errorComponent={StatCardFallback}
        getResetKey={() => "reset"}
      >
        <Card>
          <Label>total volume</Label>
          <Value>—</Value>
        </Card>
      </CatchBoundary>

      <CatchBoundary
        errorComponent={StatCardFallback}
        getResetKey={() => "reset"}
      >
        <Card>
          <Label>total sets</Label>
          <Value>—</Value>
        </Card>
      </CatchBoundary>
    </Grid>
  );
};

const StatCardFallback = (props: ErrorComponentProps) => {
  return (
    <Card
      role="alert"
      className="border-destructive bg-destructive/10 cursor-pointer"
      title={props.error.message}
      onClick={props.reset}
    >
      <Label className="text-destructive">error</Label>
      <Value className="text-destructive text-sm font-medium">
        something went wrong
      </Value>
    </Card>
  );
};

const Grid = (props: ComponentProps<"ul">) => {
  return (
    <ul
      className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,15rem),1fr))] gap-3"
      {...props}
    />
  );
};

const Card = ({ className, ...props }: ComponentProps<"li">) => {
  return (
    <li
      className={cn(
        "bg-secondary flex flex-col gap-1 rounded-md border p-3",
        className,
      )}
      {...props}
    />
  );
};

const Label = ({ className, ...props }: ComponentProps<"dt">) => {
  return (
    <dt
      className={cn("text-muted-foreground text-xs font-medium", className)}
      {...props}
    />
  );
};

const Value = ({ className, ...props }: ComponentProps<"dd">) => {
  return <dd className={cn("text-2xl font-semibold", className)} {...props} />;
};
