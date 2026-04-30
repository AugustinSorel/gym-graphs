import { Button } from "~/ui/button";
import { Input } from "~/ui/input";
import { MinusIcon, PlusIcon } from "~/ui/icons";
import type {
  ControllerFieldState,
  ControllerRenderProps,
  FieldValues,
  Path,
} from "react-hook-form";

export const CounterInput = <T extends FieldValues>(props: Props<T>) => {
  return (
    <div className="flex w-max items-center justify-center rounded-md border">
      <Input
        className="border-none"
        type="number"
        placeholder="10"
        aria-invalid={props.fieldState.invalid}
        id={props.field.name}
        {...props.field}
        onChange={(e) => {
          props.field.onChange(e.target.valueAsNumber || "");
        }}
      />
      <Button
        type="button"
        variant="ghost"
        className="rounded-none border-l"
        onClick={() => {
          props.field.onChange((props.field.value ?? 0) - 1);
        }}
      >
        <MinusIcon />
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="rounded-none border-l"
        onClick={() => {
          props.field.onChange((props.field.value ?? 0) + 1);
        }}
      >
        <PlusIcon />
      </Button>
    </div>
  );
};

type Props<T extends FieldValues> = {
  field: ControllerRenderProps<T, Path<T>>;
  fieldState: ControllerFieldState;
};
