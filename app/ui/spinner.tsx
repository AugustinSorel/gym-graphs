import { Loader } from "lucide-react";
import { cn } from "~/styles/styles.utils";

export type SpinnerProps = React.SVGProps<SVGSVGElement>;

export const Spinner = ({ className, ...rest }: SpinnerProps) => {
  return <Loader className={cn("size-4 animate-spin", className)} {...rest} />;
};
