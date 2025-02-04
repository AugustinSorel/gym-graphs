import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "~/styles/styles.utils";

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive: "border-destructive bg-destructive/10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const Alert = ({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof alertVariants>) => (
  <div
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
);
Alert.displayName = "Alert";

const AlertTitle = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h5
    className={cn(
      "mb-1 text-lg leading-none font-medium tracking-tight",
      className,
    )}
    {...props}
  />
);
AlertTitle.displayName = "AlertTitle";

const AlertDescription = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <div className={cn("text-sm [&_p]:leading-relaxed", className)} {...props} />
);
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
