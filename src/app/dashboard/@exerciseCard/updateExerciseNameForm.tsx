"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToastAction } from "@/components/ui/toast";
import { toast } from "@/components/ui/use-toast";
import { newExerciseNameSchema } from "@/schemas/exerciseSchemas";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { experimental_useFormStatus as useFormStatus } from "react-dom";

type Props = {
  onAction: (formData: FormData) => Promise<void>;
  onSuccesss: () => void;
};

//FIXME: remove warning
export const UpdateExerciseNameForm = ({ onAction, onSuccesss }: Props) => {
  const [updatedExerciseName, setUpdatedExerciseName] = useState("bench press");

  const actionHandler = async (e: FormData) => {
    const data = newExerciseNameSchema.safeParse({ name: updatedExerciseName });

    if (!data.success) {
      return toast({
        variant: "destructive",
        title: "Something went wrong",
        description: data.error.issues[0]?.message,
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

    try {
      await onAction(e);
      setUpdatedExerciseName("");
      onSuccesss();
    } catch (error) {
      return toast({
        variant: "destructive",
        title: "Something went wrong",
        description: error instanceof Error ? error.message : "try again",
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
    <form className="flex flex-col gap-2" action={(e) => void actionHandler(e)}>
      <Label htmlFor="name" className="capitalize">
        exercise name
      </Label>
      <Input
        id="name"
        value={updatedExerciseName}
        onChange={(e) => setUpdatedExerciseName(e.target.value)}
      />

      <SubmitButton />
    </form>
  );
};

const SubmitButton = () => {
  const formStatus = useFormStatus();
  return (
    <Button className="ml-auto space-x-2" disabled={formStatus.pending}>
      {formStatus.pending && <Loader />}
      <span className="capitalize">save change</span>
    </Button>
  );
};
