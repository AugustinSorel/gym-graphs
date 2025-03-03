import { SpinnerIcon } from "~/ui/icons";
import { cn } from "~/styles/styles.utils";

export type SpinnerProps = React.SVGProps<SVGSVGElement>;

export const Spinner = ({ className, ...rest }: SpinnerProps) => {
  return <SpinnerIcon className={cn("animate-spin", className)} {...rest} />;
};
