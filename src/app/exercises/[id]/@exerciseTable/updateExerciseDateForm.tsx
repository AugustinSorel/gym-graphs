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

export const UpdateExerciseDateForm = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [exerciseDate, setExerciseDate] = useState(new Date());

  //TODO: add sumbit handler
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
        <form className="flex flex-col gap-2">
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
