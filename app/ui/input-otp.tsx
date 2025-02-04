import * as React from "react";
import { OTPInput, OTPInputContext } from "input-otp";
import { Minus } from "lucide-react";
import { cn } from "~/styles/styles.utils";

const InputOTP = ({
  className,
  containerClassName,
  ...props
}: React.ComponentPropsWithoutRef<typeof OTPInput>) => (
  <OTPInput
    containerClassName={cn(
      "flex items-center gap-2 has-disabled:opacity-50",
      containerClassName,
    )}
    className={cn("disabled:cursor-not-allowed", className)}
    {...props}
  />
);
InputOTP.displayName = "InputOTP";

const InputOTPGroup = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) => (
  <div className={cn("flex items-center", className)} {...props} />
);
InputOTPGroup.displayName = "InputOTPGroup";

const InputOTPSlot = ({
  index,
  className,
  ...props
}: React.ComponentProps<"div"> & { index: number }) => {
  const inputOTPContext = React.useContext(OTPInputContext);
  const slot = inputOTPContext.slots.at(index);

  if (!slot) {
    throw new Error("no slot found for given index");
  }

  const { char, hasFakeCaret, isActive } = slot;

  return (
    <div
      className={cn(
        "border-input relative flex h-9 w-9 items-center justify-center border-y border-r text-sm shadow-xs transition-all first:rounded-l-md first:border-l last:rounded-r-md",
        isActive && "ring-ring z-10 ring-1",
        className,
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="animate-caret-blink bg-foreground h-4 w-px duration-1000" />
        </div>
      )}
    </div>
  );
};
InputOTPSlot.displayName = "InputOTPSlot";

const InputOTPSeparator = ({
  ...props
}: React.ComponentPropsWithoutRef<"div">) => (
  <div role="separator" {...props}>
    <Minus />
  </div>
);
InputOTPSeparator.displayName = "InputOTPSeparator";

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };
