import { generateSessionToken, hashSHA256Hex } from "~/session/session.utils";
import { fifteenDaysInMs } from "~/utils/dates";
import type { Session, User } from "~/db/db.schemas";
import type { createSessionRepo } from "~/session/session.repo";
import type { SessionToken } from "~/session/session.utils";

export const createSessionService = (
  sessionRepo: ReturnType<typeof createSessionRepo>,
) => {
  return {
    create: async (userId: User["id"]) => {
      const token = generateSessionToken();

      const session = await sessionRepo.create(token, userId);

      return {
        token,
        session,
      };
    },

    delete: async (sessionId: Session["id"]) => {
      return sessionRepo.delete(sessionId);
    },

    validate: async (candidateSessionToken: SessionToken) => {
      const sessionId = hashSHA256Hex(candidateSessionToken);

      const session = await sessionRepo.selectById(sessionId);

      if (!session) {
        return null;
      }

      const sessionExpired = Date.now() >= session.expiresAt.getTime();

      if (sessionExpired) {
        await sessionRepo.delete(session.id);

        return null;
      }

      const sessionNearExpiry =
        Date.now() >= session.expiresAt.getTime() - fifteenDaysInMs;

      if (sessionNearExpiry) {
        await sessionRepo.refreshExpiryDate(session.id);
      }

      return session;
    },
  };
};
