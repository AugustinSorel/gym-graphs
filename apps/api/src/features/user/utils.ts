import type { User } from "#/integrations/db/schema";

export const inferNameFromEmail = (email: User["email"]) => {
  return email.split("@").at(0) ?? "anonymous";
};
