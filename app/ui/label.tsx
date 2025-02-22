import * as LabelPrimitive from "@radix-ui/react-label";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "~/styles/styles.utils";

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
);

type Props = ComponentProps<typeof LabelPrimitive.Root> &
  VariantProps<typeof labelVariants>;

const Label = ({ className, ...props }: Props) => {
  return (
    <LabelPrimitive.Root
      className={cn(labelVariants(), className)}
      {...props}
    />
  );
};
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
