import { Badge } from "~/ui/badge";
import { getRouteApi } from "@tanstack/react-router";
import type { ComponentProps } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { exerciseQueries } from "../exercise.queries";

export const TagsList = () => {
  const params = routeApi.useParams();
  const tags = useSuspenseQuery(exerciseQueries.tags(params.exerciseId));

  if (!tags.data.length) {
    return <NoTagsText>no tags</NoTagsText>;
  }

  return (
    <List>
      {tags.data.map((tag) => (
        <ListItem key={tag.id}>
          <Badge variant="outline">{tag.name}</Badge>
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

const routeApi = getRouteApi("/(authed)/exercises/$exerciseId");
