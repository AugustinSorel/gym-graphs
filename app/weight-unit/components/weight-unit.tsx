import { useUser } from "~/user/hooks/use-user";

export const WeightUnit = () => {
  const user = useUser();

  switch (user.data.weightUnit) {
    case "kg":
      return "kg";
    case "lbs":
      return "lbs";
  }

  user.data.weightUnit satisfies never;
};
