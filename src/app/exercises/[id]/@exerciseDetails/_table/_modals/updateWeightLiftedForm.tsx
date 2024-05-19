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
import { useToast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";
import type { ExerciseData } from "@/db/types";
import { convertWeightToKg } from "@/lib/math";
import { useWeightUnit } from "@/context/weightUnit";
import { api } from "@/trpc/react";

type Props = {
  exerciseData: ExerciseData;
};

export const UpdateWeightLifted = ({ exerciseData }: Props) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const weightUnit = useWeightUnit();
  const [updatedWeightLifted, setUpdatedWeightLifted] = useState(
    exerciseData.weightLifted.toString(),
  );
  const { toast } = useToast();

  const updateWeightLifted = api.exerciseData.updateWeightLifted.useMutation({
    onSuccess: () => {
      setIsDialogOpen(() => false);
    },
    onError: (error, variables) => {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: error.message,
        action: (
          <ToastAction
            altText="Try again"
            onClick={() => updateWeightLifted.mutate(variables)}
          >
            Try again
          </ToastAction>
        ),
      });
    },
  });

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
          <DialogTitle className="capitalize">change weight lifted</DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            updateWeightLifted.mutate({
              id: exerciseData.id,
              weightLifted: convertWeightToKg(
                +updatedWeightLifted,
                weightUnit.get,
              ),
            });
          }}
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

          <Button
            className="ml-auto space-x-2"
            disabled={updateWeightLifted.isPending}
          >
            {updateWeightLifted.isPending && <Loader />}
            <span className="capitalize">save change</span>
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
