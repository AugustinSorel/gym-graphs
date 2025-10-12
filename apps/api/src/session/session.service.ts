import { generateSessionToken } from "~/session/session.utils";
import type { User } from "~/db/db.schemas";
import type { createSessionModel } from "~/session/session.model";

export const createSessionService = (
  model: ReturnType<typeof createSessionModel>,
) => {
  return {
    create: async (userId: User["id"]) => {
      const token = generateSessionToken();

      const session = await model.create(token, userId);

      return {
        token,
        session,
      };
    },
  };
};
