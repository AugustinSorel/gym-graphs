import Link from "next/link";
import { NewExerciseNameForm } from "./newExerciseNameForm";
import { newExerciseNameSchema } from "@/schemas/exerciseSchemas";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Edit2, Trash } from "lucide-react";

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
          <ContextMenu key={i}>
            <ContextMenuTrigger asChild>
              <li className="relative h-exercise-card rounded-md border border-border bg-primary backdrop-blur-md duration-300 hover:scale-[1.02] hover:bg-border">
                <header className="border-b border-border bg-primary p-2">
                  <p className="truncate capitalize">bench press</p>
                </header>

                <Link
                  href="/exercises/1"
                  className="absolute inset-0 -z-10 duration-300"
                />
              </li>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-64">
              <ContextMenuLabel>Settings</ContextMenuLabel>
              <ContextMenuSeparator />
              <ContextMenuItem>
                <Edit2 className="mr-2 h-4 w-4" />
                <span className="capitalize">rename</span>
              </ContextMenuItem>
              <ContextMenuItem className="text-destructive/80 focus:bg-destructive/20 focus:text-destructive">
                <Trash className="mr-2 h-4 w-4" />
                <span className="capitalize">delete exercise</span>
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
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
