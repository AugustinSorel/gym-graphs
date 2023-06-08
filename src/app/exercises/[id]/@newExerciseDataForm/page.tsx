"use client";

import { experimental_useFormStatus as useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Plus } from "lucide-react";

const Page = () => {
  return (
    <form className="mx-auto flex max-w-2xl gap-2">
      <Input placeholder="№ of reps..." />
      <Input placeholder="Weight" />
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <SubmitButton />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="capitalize">add</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </form>
  );
};

const SubmitButton = () => {
  const formStatus = useFormStatus();
  return (
    <Button size="icon" aria-label="add" disabled={formStatus.pending}>
      {formStatus.pending ? (
        <Loader className="h-4 w-4" />
      ) : (
        <Plus className="h-4 w-4" />
      )}
    </Button>
  );
};

export default Page;
