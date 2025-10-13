import { generateSessionToken, hashSHA256Hex } from "~/session/session.utils";
import { fifteenDaysInMs } from "~/utils/dates";
import { sessionRepo } from "./session.repo";
import { HTTPException } from "hono/http-exception";
import type { Session } from "~/db/db.schemas";
import type { SessionToken } from "~/session/session.utils";
import type { Db } from "~/libs/db";

const create = async (userId: Session["userId"], db: Db) => {
  const token = generateSessionToken();

  const session = await sessionRepo.create(token, userId, db);

  if (!session) {
    throw new HTTPException(404, { message: "session not found" });
  }

  return {
    token,
    session,
  };
};

const remove = async (sessionId: Session["id"], db: Db) => {
  const session = await sessionRepo.remove(sessionId, db);

  if (!session) {
    throw new HTTPException(404, { message: "session not found" });
  }

  return session;
};

const removeByUserId = async (userId: Session["userId"], db: Db) => {
  const session = await sessionRepo.removeByUserId(userId, db);

  if (!session) {
    throw new HTTPException(404, { message: "session not found" });
  }

  return session;
};

const validate = async (candidateSessionToken: SessionToken, db: Db) => {
  const sessionId = hashSHA256Hex(candidateSessionToken);

  const session = await sessionRepo.select(sessionId, db);

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
export type SessionCtx = Awaited<ReturnType<typeof validate>>;

export const sessionService = {
  create,
  remove,
  removeByUserId,
  validate,
};
