import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "~/styles/styles.utils";

const inputVariants = cva(
  "flex rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
  {
    variants: {
      variant: {
        default: "",
        secondary: "bg-secondary",
      },
      size: {
        default: "w-full h-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type InputProps = ComponentProps<"input"> &
  VariantProps<typeof inputVariants>;

const Input = ({ className, size, variant, ...props }: InputProps) => {
  return (
    <input
      className={cn(inputVariants({ variant, size, className }))}
      {...props}
    />
  );
};
Input.displayName = "Input";

export { Input };
