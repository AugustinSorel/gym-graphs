import { useUser } from "~/user/user.context";

export const WeightUnit = () => {
  const user = useUser();

  switch (user.weightUnit) {
    case "kg":
      return "kg";
    case "lbs":
      return "lbs";
  }

  user.weightUnit satisfies never;
};
