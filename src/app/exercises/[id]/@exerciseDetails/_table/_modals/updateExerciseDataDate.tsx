import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Loader } from "@/components/ui/loader";
import { CalendarIcon, Edit2 } from "lucide-react";
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { dateAsYearMonthDayFormat, formatDate } from "@/lib/date";
import { useToast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";
import type { ExerciseData } from "@/db/types";
import { api } from "@/trpc/react";
import { exerciseDataSchema } from "@/schemas/exerciseData.schemas";

type Props = {
  exerciseData: ExerciseData;
};

export const UpdateExerciseDataDate = ({ exerciseData }: Props) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [exerciseDate, setExerciseDate] = useState(
    new Date(exerciseData.doneAt),
  );
  const { toast } = useToast();

  const updateDoneAt = api.exerciseData.updateDoneAt.useMutation({
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
            onClick={() => updateDoneAt.mutate(variables)}
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
          <span className="capitalize">change date</span>
        </DropdownMenuItem>
      </DialogTrigger>

      <DialogContent className="space-y-5 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="capitalize">change exercise date</DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            updateDoneAt.mutate({
              id: exerciseData.id,
              doneAt: dateAsYearMonthDayFormat(exerciseDate),
            });
          }}
        >
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(!exerciseDate && "text-muted-foreground")}
              >
                {exerciseDate ? (
                  formatDate(exerciseDate)
                ) : (
                  <span>Pick a date</span>
                )}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <Calendar
                mode="single"
                selected={exerciseDate}
                onSelect={(day) => setExerciseDate(day ?? new Date())}
                disabled={(date) =>
                  !exerciseDataSchema
                    .pick({ doneAt: true })
                    .safeParse({ doneAt: dateAsYearMonthDayFormat(date) })
                    .success
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Button
            className="ml-auto space-x-2"
            disabled={updateDoneAt.isPending}
          >
            {updateDoneAt.isPending && <Loader />}
            <span className="capitalize">save change</span>
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
