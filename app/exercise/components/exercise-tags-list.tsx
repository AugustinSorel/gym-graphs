import { Badge } from "~/ui/badge";
import { useExercise } from "~/exercise/hooks/use-exercise";
import { getRouteApi } from "@tanstack/react-router";
import type { ComponentProps } from "react";

export const ExerciseTagsList = () => {
  const params = routeApi.useParams();
  const exercise = useExercise({ id: params.exerciseId });
  const tileToTags = exercise.data.tile.tileToTags;

  if (!tileToTags.length) {
    return <NoTagsText>no tags</NoTagsText>;
  }

  return (
    <List>
      {tileToTags.map((tileToTag) => (
        <ListItem key={tileToTag.tag.id}>
          <Badge variant="outline">{tileToTag.tag.name}</Badge>
        </ListItem>
      ))}
    </List>
  );
};

const List = (props: ComponentProps<"ul">) => {
  return <ul className="flex flex-wrap gap-1 p-3 lg:gap-4 lg:p-6" {...props} />;
};

const ListItem = (props: ComponentProps<"li">) => {
  return <li {...props} />;
};

const NoTagsText = (props: ComponentProps<"p">) => {
  return (
    <p
      className="text-muted-foreground m-auto p-6 text-center text-sm"
      {...props}
    />
  );
};

const routeApi = getRouteApi("/exercises/$exerciseId");
