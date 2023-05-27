import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getSession } from "@/lib/auth";
import { Plus } from "lucide-react";
import { redirect } from "next/navigation";

const DashboardPage = async () => {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <div className="space-y-5 p-5">
      <form
        action=" "
        className="mx-auto grid max-w-2xl grid-cols-[1fr_auto]  items-stretch gap-2"
      >
        <Input placeholder="new exercise name" />

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" aria-label="add">
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="capitalize">add</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </form>

      <ul className="mx-auto grid max-w-[calc(var(--exercise-card-height)*4+20px*3)] grid-cols-[repeat(auto-fill,minmax(var(--exercise-card-height),1fr))] gap-5">
        {[...Array<unknown>(10)].map((_, i) => (
          <li
            key={i}
            className="h-exercise-card rounded-md border border-border bg-primary p-1 backdrop-blur-md"
          >
            super
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DashboardPage;
