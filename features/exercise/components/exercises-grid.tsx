import { useSuspenseQuery } from "@tanstack/react-query";
import { exerciseKeys } from "../exercise.keys";
import { useUser } from "~/features/context/user.context";
import { ComponentProps } from "react";

export const ExercisesGrid = () => {
  const user = useUser();
  const exercises = useSuspenseQuery(exerciseKeys.all(user.id));

  if (!exercises.data.length) {
    return <p className="text-center">no exercises</p>;
  }

  return (
    <List>
      {exercises.data.map((exercise) => (
        <Exercise key={exercise.name + exercise.userId}>
          <Name>{exercise.name}</Name>
          <div className="h-[200px]" />
        </Exercise>
      ))}
    </List>
  );
};

const List = (props: ComponentProps<"ol">) => {
  return (
    <ol
      className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,var(--dashboard-card-width)),1fr))] gap-5"
      {...props}
    />
  );
};

const Exercise = (props: ComponentProps<"li">) => {
  return <li className="rounded-md border bg-secondary" {...props} />;
};

const Name = (props: ComponentProps<"h2">) => {
  return (
    <h2
      className="truncate border-b p-4 text-sm font-semibold capitalize"
      {...props}
    />
  );
};
