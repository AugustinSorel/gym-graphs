import { Badge } from "~/ui/badge";
import { useExercise } from "../hooks/useExercise";
import { getRouteApi } from "@tanstack/react-router";
import type { ComponentProps } from "react";

export const ExerciseTagsList = () => {
  const params = routeApi.useParams();
  const exercise = useExercise({ id: params.exerciseId });
  const tags = exercise.data.tags;

  if (!tags.length) {
    return <NoTagsText>no tags</NoTagsText>;
  }

  return (
    <List>
      {exercise.data.tags.map((x) => (
        <ListItem key={x.tagId}>
          <Badge variant="outline">{x.tag.name}</Badge>
        </ListItem>
      ))}
    </List>
  );
};

const List = (props: ComponentProps<"ul">) => {
  return <ul className="flex flex-wrap gap-4 p-6" {...props} />;
};

const ListItem = (props: ComponentProps<"li">) => {
  return <li {...props} />;
};

const NoTagsText = (props: ComponentProps<"p">) => {
  return (
    <p className="m-auto p-6 text-center text-muted-foreground" {...props} />
  );
};

const routeApi = getRouteApi("/exercises/$exerciseId");
