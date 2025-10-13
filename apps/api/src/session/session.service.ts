import { generateSessionToken, hashSHA256Hex } from "~/session/session.utils";
import { fifteenDaysInMs } from "~/utils/dates";
import { sessionRepo } from "./session.repo";
import type { Session, User } from "~/db/db.schemas";
import type { SessionToken } from "~/session/session.utils";
import type { Db } from "~/libs/db";

const create = async (userId: User["id"], db: Db) => {
  const token = generateSessionToken();

  const session = await sessionRepo.create(token, userId, db);

  return {
    token,
    session,
  };
};

const remove = async (sessionId: Session["id"], db: Db) => {
  return sessionRepo.remove(sessionId, db);
};

const validate = async (candidateSessionToken: SessionToken, db: Db) => {
  const sessionId = hashSHA256Hex(candidateSessionToken);

  const session = await sessionRepo.selectById(sessionId, db);

  if (!session) {
    return null;
  }

  const sessionExpired = Date.now() >= session.expiresAt.getTime();

  if (sessionExpired) {
    await sessionRepo.remove(session.id, db);

    return null;
  }

  const sessionNearExpiry =
    Date.now() >= session.expiresAt.getTime() - fifteenDaysInMs;

  if (sessionNearExpiry) {
    await sessionRepo.refreshExpiryDate(session.id, db);
  }

  return session;
};

export const sessionService = {
  create,
  remove,
  validate,
};
