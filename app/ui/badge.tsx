import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "~/styles/styles.utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-primary/50 bg-primary/20 text-primary hover:bg-primary/30",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-destructive/50 bg-destructive text-destructive-foreground  hover:bg-destructive/80",
        success:
          "border-success/50 bg-success/20 text-success hover:bg-success/20",
        warning:
          "border-warning/50 bg-warning/20 text-warning hover:bg-warning/20",
        outline: "text-foreground bg-foreground/5 hover:bg-foreground/10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export type BadgeProps = React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants>;

const Badge = ({ className, variant, ...props }: BadgeProps) => {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
};

export { Badge, badgeVariants };
