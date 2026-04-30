import { useSuspenseQuery } from "@tanstack/react-query";
import { userQueries } from "~/domains/user/user.queries";
import { convertWeight } from "~/domains/user/user.utils";
import { SetSuccessSchema } from "@gym-graphs/shared/set/schemas";

export const WeightValue = (props: Props) => {
  const user = useSuspenseQuery(userQueries.get);

  const formatter = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 3,
    ...props.formatter,
  });

  const displayWeight = convertWeight(props.weightInMg, user.data.weightUnit);

  return formatter.format(displayWeight);
};

type Props = Pick<typeof SetSuccessSchema.Type, "weightInMg"> &
  Partial<{
    formatter: Intl.NumberFormatOptions;
  }>;
