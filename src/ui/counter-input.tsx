import { useController } from "react-hook-form";
import { Button, ButtonProps } from "~/ui/button";
import { useFormField } from "~/ui/form";
import { Input, InputProps } from "~/ui/input";
import { MinusIcon, PlusIcon } from "~/ui/icons";

export const CounterDec = (props: ButtonProps) => {
  const formField = useFormField();

  const controller = useController(formField);

  return (
    <Button
      type="button"
      onClick={() => controller.field.onChange(controller.field.value - 1)}
      {...props}
    />
  );
};

export const CounterInc = (props: ButtonProps) => {
  const formField = useFormField();

  const controller = useController(formField);

  return (
    <Button
      type="button"
      onClick={() => controller.field.onChange(controller.field.value + 1)}
      {...props}
    />
  );
};

export const CounterInputField = (props: InputProps) => {
  const formField = useFormField();

  const controller = useController(formField);

  return (
    <Input type="number" placeholder="10" {...controller.field} {...props} />
  );
};

export const CounterInput = () => {
  return (
    <div className="flex w-max items-center justify-center rounded-md border">
      <CounterInputField className="border-none shadow-none" />
      <CounterDec variant="ghost" className="rounded-none border-l">
        <MinusIcon />
      </CounterDec>
      <CounterInc variant="ghost" className="rounded-none border-l">
        <PlusIcon />
      </CounterInc>
    </div>
  );
};
