import type { User } from "~/db/db.schemas";

export const inferNameFromEmail = (email: User["email"]) => {
  return email.split("@").at(0) ?? "anonymous";
};
