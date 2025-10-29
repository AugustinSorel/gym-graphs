import { useController } from "react-hook-form";
import { Button, ButtonProps } from "~/ui/button";
import { useFormField } from "~/ui/form";
import { Input, InputProps } from "~/ui/input";
import { MinusIcon, PlusIcon } from "~/ui/icons";
import { z } from "zod";

const counterSchema = z.coerce.number().catch(0);

export const CounterDec = (props: ButtonProps) => {
  const formField = useFormField();

  const controller = useController(formField);

  return (
    <Button
      type="button"
      onClick={() => {
        const value = counterSchema
          .transform((x) => x - 1)
          .parse(controller.field.value);

        controller.field.onChange(value);
      }}
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
      onClick={() => {
        const value = counterSchema
          .transform((x) => x + 1)
          .parse(controller.field.value);

        controller.field.onChange(value);
      }}
      {...props}
    />
  );
};

export const CounterInputField = (props: InputProps) => {
  const formField = useFormField();

  const controller = useController(formField);

  return (
    <Input
      type="number"
      placeholder="10"
      {...controller.field}
      onChange={(e) => {
        controller.field.onChange(e.target.valueAsNumber || "");
      }}
      {...props}
    />
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
