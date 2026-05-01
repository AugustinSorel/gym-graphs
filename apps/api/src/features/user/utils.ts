import type { User } from "@gym-graphs/shared/user/schemas";

export const inferNameFromEmail = (email: User["email"]) => {
  return email.split("@").at(0) ?? "anonymous";
};
