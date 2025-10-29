import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "~/ui/dropdown-menu";
import { Button } from "~/ui/button";
import { EllipsisIcon } from "~/ui/icons";
import { DeleteTagDialog } from "~/domains/tag/components/delete-tag-dialog";
import { pluralize } from "~/utils/string";
import { RenameTagDialog } from "~/domains/tag/components/rename-tag-dialog";
import { TagProvider } from "~/domains/tag/tag.context";
import { useTagCounts } from "~/domains/tag/hooks/use-tag-counts";
import type { ComponentProps } from "react";

export const TagsList = () => {
  const tagCounts = useTagCounts();

  if (!tagCounts.length) {
    return <NoTagsMsg>no tags</NoTagsMsg>;
  }

  return (
    <List>
      {tagCounts.map((tag) => (
        <Tag key={tag.id}>
          <TagName>{tag.name}</TagName>

          <TagExercisesLinked>
            {pluralize(tag.count, "exercise")} linked
          </TagExercisesLinked>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="row-span-3 h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <EllipsisIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <TagProvider value={tag}>
                <RenameTagDialog />
                <DeleteTagDialog />
              </TagProvider>
            </DropdownMenuContent>
          </DropdownMenu>
        </Tag>
      ))}
    </List>
  );
};

const List = (props: ComponentProps<"ul">) => {
  return (
    <ul
      className="max-h-96 items-center overflow-auto rounded-md border [counter-reset:item]"
      {...props}
    />
  );
};

const Tag = (props: ComponentProps<"li">) => {
  return (
    <li
      className="hover:bg-accent before:border-border before:bg-accent before:text-muted-foreground relative grid grid-cols-[auto_1fr_auto] items-center gap-x-4 p-4 text-sm transition-colors [counter-increment:item] before:row-span-2 before:flex before:h-10 before:w-10 before:items-center before:justify-center before:rounded-full before:border before:text-lg before:font-semibold before:content-[counter(item)]"
      {...props}
    />
  );
};

const TagName = (props: ComponentProps<"h3">) => {
  return <h3 className="truncate font-semibold capitalize" {...props} />;
};

const TagExercisesLinked = (props: ComponentProps<"p">) => {
  return <p className="col-start-2 row-start-2 truncate text-xs" {...props} />;
};

const NoTagsMsg = (props: ComponentProps<"p">) => {
  return (
    <p
      className="text-muted-foreground rounded-md border p-6 text-center"
      {...props}
    />
  );
};
