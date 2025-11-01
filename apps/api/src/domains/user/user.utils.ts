import type { User } from "@gym-graphs/db/schemas";

export const inferNameFromEmail = (email: User["email"]) => {
  return email.split("@").at(0) ?? "anonymous";
};
