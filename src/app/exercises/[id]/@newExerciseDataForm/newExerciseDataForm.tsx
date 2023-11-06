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
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { addExerciseDataSchema } from "@/schemas/exerciseSchemas";
import { addExerciseDataAction } from "@/serverActions/exerciseData";
import { useWeightUnit } from "@/context/weightUnit";
import { convertWeightToKg } from "@/lib/math";
import { usePathname } from "next/navigation";
import { getErrorMessage } from "@/lib/utils";

export const NewExerciseDataForm = () => {
  const [numberOfRepetitions, setNumberofRepetitions] = useState("");
  const [weightLifted, setWeightLifted] = useState("");
  const { toast } = useToast();
  const weightUnit = useWeightUnit();
  const pathname = usePathname().split("/");

  const actionHandler = async (e: FormData) => {
    try {
      const data = addExerciseDataSchema.parse({
        numberOfReps: +numberOfRepetitions,
        weightLifted: convertWeightToKg(+weightLifted, weightUnit.get),
        exerciseId: pathname[2],
      });

      const res = await addExerciseDataAction(data);

      if (res.serverError) {
        throw new Error(res.serverError);
      }

      setNumberofRepetitions("");
      setWeightLifted("");
    } catch (error) {
      return toast({
        variant: "destructive",
        title: "Something went wrong",
        description: getErrorMessage(error),
        action: (
          <ToastAction
            altText="Try again"
            onClick={() => void actionHandler(e)}
          >
            Try again
          </ToastAction>
        ),
      });
    }
  };

  return (
    <form
      className="mx-auto flex max-w-2xl gap-2"
      action={(e) => void actionHandler(e)}
    >
      <Input
        placeholder="№ of reps..."
        value={numberOfRepetitions}
        onChange={(e) => setNumberofRepetitions(e.target.value)}
        name="numberOfRepetitions"
        autoComplete="off"
      />
      <Input
        placeholder={`Weight - (${weightUnit.get})`}
        value={weightLifted}
        onChange={(e) => setWeightLifted(e.target.value)}
        name="weightLifted"
        autoComplete="off"
      />
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
