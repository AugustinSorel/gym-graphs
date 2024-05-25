import type { ComponentProps, ComponentPropsWithoutRef } from "react";
import { ExerciseTable } from "./_table/dataTable";

type Props = ComponentProps<typeof ExerciseTable>;

export const ExerciseTableCard = ({ columns }: Props) => {
  return (
    <Card>
      <ExerciseTable columns={columns} />
    </Card>
  );
};
const Card = (props: ComponentPropsWithoutRef<"div">) => {
  return (
    <div
      {...props}
      className="overflow-hidden border-y border-border bg-primary backdrop-blur-md sm:rounded-md sm:border"
    />
  );
};
