import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/ui/dropdown-menu";
import { Button } from "~/ui/button";
import { useUser } from "~/user/user.context";
import { Filter } from "lucide-react";
import { getRouteApi } from "@tanstack/react-router";

export const FilterExercisesByTag = () => {
  const search = routeApi.useSearch();

  const tags = new Set(search.tags);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="relative after:absolute after:right-0 after:top-0 after:flex after:size-5 after:-translate-y-1/2 after:translate-x-1/2 after:items-center after:justify-center after:rounded-full after:border after:border-border after:bg-primary after:text-xs after:font-semibold after:text-primary-foreground after:content-[attr(data-counter)] data-[counter=0]:after:hidden"
          data-counter={tags.size}
        >
          <span className="hidden sm:block">tags</span>
          <Filter className="sm:hidden" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-h-72 w-56 overflow-auto">
        <DropdownMenuLabel>Filter by tags</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <TagsItem />
        <ClearTagsItem />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const TagsItem = () => {
  const user = useUser();
  const search = routeApi.useSearch();
  const navigate = routeApi.useNavigate();

  const tags = new Set(search.tags);

  const updateSearchTags = () => {
    void navigate({
      search: (search) => ({
        ...search,
        tags: tags.size ? [...tags] : undefined,
      }),
    });
  };

  if (!user.tags.length) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">no tags</p>
    );
  }

  return (
    <>
      {user.tags.map((tag) => (
        <DropdownMenuCheckboxItem
          key={tag.id}
          checked={tags.has(tag.name)}
          onCheckedChange={(checked) => {
            if (checked) {
              tags.add(tag.name);
            } else {
              tags.delete(tag.name);
            }

            updateSearchTags();
          }}
        >
          {tag.name}
        </DropdownMenuCheckboxItem>
      ))}
    </>
  );
};

const ClearTagsItem = () => {
  const search = routeApi.useSearch();
  const navigate = routeApi.useNavigate();

  const tags = new Set(search.tags);

  const clearTags = () => {
    void navigate({
      search: (search) => ({
        ...search,
        tags: undefined,
      }),
    });
  };

  if (!search.tags?.length) {
    return null;
  }

  return (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onSelect={() => {
          tags.clear();
          clearTags();
        }}
        className="justify-center text-center"
      >
        Clear tags
      </DropdownMenuItem>
    </>
  );
};

const routeApi = getRouteApi("/dashboard");
