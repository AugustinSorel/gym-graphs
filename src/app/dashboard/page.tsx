import Link from "next/link";
import { NewExerciseNameForm } from "./newExerciseNameForm";
import { newExerciseNameSchema } from "@/schemas/exerciseSchemas";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Edit2, MoreHorizontal, Trash } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const DashboardPage = () => {
  const action = async (formData: FormData) => {
    "use server";
    const data = newExerciseNameSchema.safeParse({
      name: formData.get("newExerciseName"),
    });

    if (!data.success) {
      throw new Error(data.error.issues[0]?.message);
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
    //TODO: inset data in db
    console.log(`data: ${data.data.name}`);
  };

  return (
    <div className="space-y-5 p-5">
      <NewExerciseNameForm action={action} />

      <ul className="mx-auto grid max-w-[calc(var(--exercise-card-height)*4+20px*3)] grid-cols-[repeat(auto-fill,minmax(min(100%,var(--exercise-card-height)),1fr))] gap-5">
        {[...Array<unknown>(10)].map((_, i) => (
          <div
            className="group relative h-exercise-card rounded-md border border-border bg-primary backdrop-blur-md duration-300 hover:scale-[1.02] hover:bg-border"
            key={i}
          >
            <header className="flex items-center justify-between border-b border-border bg-primary p-2">
              <Link
                href="/exercises/1"
                className="absolute inset-0 -z-10 duration-300"
              />

              <p className="truncate capitalize">bench press</p>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    className="h-8 p-1 opacity-0 transition-all duration-100 group-focus-within:opacity-100 group-hover:opacity-100 aria-[expanded=true]:opacity-100"
                    size="icon"
                    variant="ghost"
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
          </div>
        ))}

        {[...Array<unknown>(10)].map((_, i) => (
          <Skeleton
            key={i}
            className="h-exercise-card rounded-md border border-border bg-primary backdrop-blur-md"
          >
            <header className="h-11 border-b border-border bg-primary" />
          </Skeleton>
        ))}
      </ul>
    </div>
  );
};

export default DashboardPage;
