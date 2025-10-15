import { generateSessionToken } from "~/domains/session/session.utils";
import { fifteenDaysInMs } from "~/utils/dates";
import { sessionRepo } from "~/domains/session/session.repo";
import { HTTPException } from "hono/http-exception";
import { hashSHA256Hex, verifySecret } from "~/libs/crypto";
import { userRepo } from "~/domains/user/user.repo";
import type { SignInSchema } from "@gym-graphs/schemas/session";
import type { Session } from "~/db/db.schemas";
import type { SessionToken } from "~/domains/session/session.utils";
import type { Db } from "~/libs/db";

const signOut = async (sessionId: Session["id"], db: Db) => {
  const session = await sessionRepo.deleteById(sessionId, db);

  if (!session) {
    throw new HTTPException(404, { message: "session not found" });
  }

  return session;
};

const validate = async (candidateSessionToken: SessionToken, db: Db) => {
  const sessionId = hashSHA256Hex(candidateSessionToken);

  const session = await sessionRepo.selectById(sessionId, db);

  if (!session) {
    return null;
  }

  const sessionExpired = Date.now() >= session.expiresAt.getTime();

  if (sessionExpired) {
    await sessionRepo.deleteById(session.id, db);

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

const signIn = async (input: SignInSchema, db: Db) => {
  return db.transaction(async (tx) => {
    const user = await userRepo.selectByEmail(input.email, tx);

    if (!user) {
      throw new HTTPException(409, {
        message: "email or password is invalid",
      });
    }

    if (!user.emailVerifiedAt) {
      throw new HTTPException(403, {
        message: "email address not verified",
      });
    }

    if (!user.password || !user.salt) {
      throw new HTTPException(403, {
        message: "this account has been set up using oauth",
      });
    }

    const validPassword = await verifySecret(
      input.password,
      user.password,
      user.salt,
    );

    if (!validPassword) {
      throw new HTTPException(403, {
        message: "email or password is invalid",
      });
    }

    const token = generateSessionToken();

    const session = await sessionRepo.create(token, user.id, tx);

    return {
      session,
      token,
    };
  });
};

export const sessionService = {
  validate,
  signIn,
  signOut,
};
