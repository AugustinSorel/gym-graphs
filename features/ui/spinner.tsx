import { Loader } from "lucide-react";
import { cn } from "~/features/utils/styles";

export type SpinnerProps = React.SVGProps<SVGSVGElement>;

export const Spinner = ({ className, ...rest }: SpinnerProps) => {
  return <Loader className={cn("size-4 animate-spin", className)} {...rest} />;
};
