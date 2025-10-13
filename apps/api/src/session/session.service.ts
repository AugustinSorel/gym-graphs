import { generateSessionToken } from "~/session/session.utils";
import type { User } from "~/db/db.schemas";
import type { createSessionRepo } from "~/session/session.repo";

export const createSessionService = (
  repo: ReturnType<typeof createSessionRepo>,
) => {
  return {
    create: async (userId: User["id"]) => {
      const token = generateSessionToken();

      const session = await repo.create(token, userId);

      return {
        token,
        session,
      };
    },
  };
};
