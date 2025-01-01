import { type VariantProps, cva } from "class-variance-authority";
import { cn } from "~/features/utils/styles";
import type { SVGProps } from "react";

const iconVariants = cva("rounded-full", {
  variants: {
    size: {
      default: "size-6",
      sm: "size-4",
      lg: "size-8",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

type AppIconProps = VariantProps<typeof iconVariants> & SVGProps<SVGSVGElement>;

export const AppIcon = ({ size, className }: AppIconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 50 50"
      fill="none"
      className={cn(iconVariants({ size, className }))}
    >
      <circle cx="25" cy="25" r="25" fill="url(#gradient)" />
      <defs>
        <linearGradient
          id="gradient"
          x1="100%"
          y1="50%"
          x2="50%"
          y2="50%"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="hsl(329 82% 65%)" />
          <stop offset="1" stopColor="hsl(236 82% 70%)" />
        </linearGradient>
      </defs>
    </svg>
  );
};
