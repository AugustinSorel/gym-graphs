import { Loader2 } from "lucide-react";
import { type VariantProps, cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { SVGProps } from "react";

const loaderVariants = cva("animate-spin stroke-[3px]", {
  variants: {
    size: {
      default: "h-4 w-4 ",
      sm: "h-2 w-2",
      lg: "h-6 w-6",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

type LoaderProps = VariantProps<typeof loaderVariants> &
  SVGProps<SVGSVGElement>;

export const Loader = ({ size, className }: LoaderProps) => {
  return <Loader2 className={cn(loaderVariants({ size, className }))} />;
};
