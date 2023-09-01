//FIXME: date is save one day in the past
import { Button } from "@/components/ui/button";
import { experimental_useFormStatus as useFormStatus } from "react-dom";
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
import { formatDate } from "@/lib/date";
import type { updateExerciseDataDate } from "@/serverActions/exerciseData";
import { updateExerciseDataDateSchema } from "@/schemas/exerciseSchemas";
import { useToast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";
import type { ExerciseData } from "@/db/types";

type Props = {
  onAction: typeof updateExerciseDataDate;
  exerciseData: ExerciseData;
};

export const UpdateExerciseDataDate = ({ onAction, exerciseData }: Props) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [exerciseDate, setExerciseDate] = useState(
    new Date(exerciseData.doneAt)
  );
  const { toast } = useToast();

  const actionHandler = async (e: FormData) => {
    const data = updateExerciseDataDateSchema.safeParse({
      exerciseDataId: exerciseData.id,
      doneAt: exerciseDate,
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
      const res = await onAction(data.data);

      if ("error" in res && res.error === "duplicate") {
        throw new Error("This date clashes with an existing data");
      }

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
          <span className="capitalize">change date</span>
        </DropdownMenuItem>
      </DialogTrigger>

      <DialogContent className="space-y-5 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="capitalize">change exercise date</DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-2"
          action={(e) => void actionHandler(e)}
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
                  date > new Date() || date < new Date("1900-01-01")
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
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
