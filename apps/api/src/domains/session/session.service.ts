import { generateSessionToken } from "~/domains/session/session.utils";
import { fifteenDaysInMs } from "~/utils/dates";
import { sessionRepo } from "@gym-graphs/db/repo/session";
import { HTTPException } from "hono/http-exception";
import { hashSHA256Hex, verifySecret } from "~/libs/crypto";
import { dbErrorToHttp } from "~/libs/db";
import { userRepo } from "@gym-graphs/db/repo/user";
import { err, ok } from "neverthrow";
import type { SignInSchema } from "@gym-graphs/schemas/session";
import type { Session } from "@gym-graphs/db/schemas";
import type { SessionToken } from "~/domains/session/session.utils";
import type { Db } from "@gym-graphs/db";

const signOut = async (sessionId: Session["id"], db: Db) => {
  return sessionRepo
    .deleteById(sessionId, db)
    .match((session) => session, dbErrorToHttp);
};

const validate = async (candidateSessionToken: SessionToken, db: Db) => {
  const sessionId = hashSHA256Hex(candidateSessionToken);

  const session = await sessionRepo
    .selectById(sessionId, db)
    .orElse((e) => (e.type === "session not found" ? ok(null) : err(e)))
    .match((session) => session, dbErrorToHttp);

  if (!session) {
    return null;
  }

  const sessionExpired = Date.now() >= session.expiresAt.getTime();

  if (sessionExpired) {
    await sessionRepo
      .deleteById(session.id, db)
      .match((session) => session, dbErrorToHttp);

    return null;
  }

  const sessionNearExpiry =
    Date.now() >= session.expiresAt.getTime() - fifteenDaysInMs;

  if (sessionNearExpiry) {
    await sessionRepo
      .refreshExpiryDate(session.id, db)
      .match((session) => session, dbErrorToHttp);
  }

  return session;
};

export type SessionCtx = Awaited<ReturnType<typeof validate>>;

const signIn = async (input: SignInSchema, db: Db) => {
  return db.transaction(async (tx) => {
    const user = await userRepo
      .selectByEmail(input.email, tx)
      .orElse((e) => (e.type === "user not found" ? ok(null) : err(e)))
      .match((user) => user, dbErrorToHttp);

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

    const session = await sessionRepo
      .create(token, user.id, tx)
      .match((session) => session, dbErrorToHttp);

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
