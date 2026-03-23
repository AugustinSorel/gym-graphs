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
import { FilterIcon } from "~/ui/icons";
import { getRouteApi } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { tagQueries } from "~/domains/tag/tag.queries";

export const FilterTilesByTags = () => {
  const search = routeApi.useSearch();

  const tags = new Set(search.tags);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="bg-secondary after:border-border after:bg-primary after:text-primary-foreground relative after:absolute after:top-0 after:right-0 after:flex after:size-5 after:translate-x-1/2 after:-translate-y-1/2 after:items-center after:justify-center after:rounded-full after:border after:text-xs after:font-semibold after:content-[attr(data-counter)] data-[counter=0]:after:hidden"
          data-counter={tags.size}
          aria-label="filter exercises by tags"
        >
          <span className="hidden lg:block">tags</span>
          <FilterIcon className="lg:hidden" />
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
  const search = routeApi.useSearch();
  const navigate = routeApi.useNavigate();
  const tags = useSuspenseQuery(tagQueries.all);

  const tagsInUrl = new Set(search.tags);

  const updateSearchTags = () => {
    void navigate({
      search: (search) => ({
        ...search,
        tags: tagsInUrl.size ? [...tagsInUrl] : undefined,
      }),
    });
  };

  if (!tags.data.length) {
    return (
      <p className="text-muted-foreground py-4 text-center text-sm">no tags</p>
    );
  }

  return (
    <>
      {tags.data.map((tag) => (
        <DropdownMenuCheckboxItem
          key={tag.id}
          checked={tagsInUrl.has(tag.name)}
          onCheckedChange={(checked) => {
            if (checked) {
              tagsInUrl.add(tag.name);
            } else {
              tagsInUrl.delete(tag.name);
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

const routeApi = getRouteApi("/(authed)/dashboard");
