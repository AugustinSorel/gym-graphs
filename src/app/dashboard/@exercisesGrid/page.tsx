import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Check, Edit2, MoreHorizontal, Trash } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

const ExercisesGrid = () => {
  return (
    <ul className="mx-auto grid max-w-[calc(var(--exercise-card-height)*4+20px*3)] grid-cols-[repeat(auto-fill,minmax(min(100%,var(--exercise-card-height)),1fr))] gap-5">
      {[...Array<unknown>(10)].map((_, i) => (
        <li
          className="group relative h-exercise-card rounded-md border border-border bg-primary backdrop-blur-md duration-300 hover:scale-[1.02] hover:bg-border"
          key={i}
        >
          <Link
            href="/exercises/1"
            className="absolute inset-0 -z-10 duration-300"
            aria-label="go to exercise bench press"
          />

          <header className="flex items-center justify-between border-b border-border bg-primary p-2">
            {true ? (
              <p className="truncate capitalize">
                <span>bench press</span>
              </p>
            ) : (
              <form action="" className="flex items-center gap-2">
                <Input
                  placeholder="bench press"
                  value="bench press"
                  className="border-none bg-transparent"
                />
                <Button size="icon" variant="ghost" aria-label="update ">
                  <Check className="h-4 w-4" />
                </Button>
              </form>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="h-8 p-1 opacity-0 transition-all duration-100 group-focus-within:opacity-100 group-hover:opacity-100 aria-[expanded=true]:opacity-100"
                  size="icon"
                  variant="ghost"
                  aria-label="view more about the exercise bench press"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel className="capitalize">
                  settings
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <Edit2 className="mr-2 h-4 w-4" />
                    <span className="capitalize">rename</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive/80 focus:bg-destructive/20 focus:text-destructive">
                    <Trash className="mr-2 h-4 w-4" />
                    <span className="capitalize">delete exercise</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>
        </li>
      ))}

      {[...Array<unknown>(10)].map((_, i) => (
        <li key={i}>
          <Skeleton className="h-exercise-card rounded-md border border-border bg-primary backdrop-blur-md">
            <header className="h-11 border-b border-border bg-primary" />
          </Skeleton>
        </li>
      ))}
    </ul>
  );
};

export default ExercisesGrid;
