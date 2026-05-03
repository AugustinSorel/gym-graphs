import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "~/styles/styles.utils";
import type { VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default:
          "border-primary/50 bg-primary/20 text-primary hover:bg-primary/30",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-destructive/50 bg-destructive/20 text-destructive hover:bg-destructive/30",
        success:
          "border-success/50 bg-success/20 text-success hover:bg-success/20",
        warning:
          "border-warning/50 bg-warning/20 text-warning hover:bg-warning/20",
        outline:
          "border-foreground/15 bg-foreground/5 text-foreground  hover:bg-foreground/10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
