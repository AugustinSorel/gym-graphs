"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader } from "@/components/ui/loader";
import { Edit2 } from "lucide-react";
import { useState } from "react";
import { experimental_useFormStatus as useFormStatus } from "react-dom";
import type { updateWeightLiftedAction } from "./actions";
import { updateWeightLiftedSchema } from "@/schemas/exerciseSchemas";
import { useToast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";

type Props = { onAction: typeof updateWeightLiftedAction };

export const UpdateWeightLifted = ({ onAction }: Props) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [updatedWeightLifted, setUpdatedWeightLifted] = useState("");
  const { toast } = useToast();

  const actionHandler = async (e: FormData) => {
    const data = updateWeightLiftedSchema.safeParse({
      id: "3ece1226-bbf8-4651-ad6c-1b51cba4143a",
      weightLifted: +updatedWeightLifted,
    });

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
      await onAction(data.data);
      setUpdatedWeightLifted("");
      setIsDialogOpen(() => false);
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
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <Edit2 className="mr-2 h-4 w-4" />
          <span className="capitalize">change weight lifted</span>
        </DropdownMenuItem>
      </DialogTrigger>

      <DialogContent className="space-y-5 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="capitalize">
            change number of repetitions
          </DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-2"
          action={(e) => void actionHandler(e)}
        >
          <Label htmlFor="name" className="capitalize">
            number of reps
          </Label>
          <Input
            id="name"
            value={updatedWeightLifted}
            onChange={(e) => setUpdatedWeightLifted(e.target.value)}
            autoComplete="off"
          />

          <SubmitButton />
        </form>
      </DialogContent>
    </Dialog>
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
